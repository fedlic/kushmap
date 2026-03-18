/**
 * Fetch Google Places reviews for all shops (EN, JA, TH) and store in google_reviews table.
 * Run: node scripts/fetch-google-reviews.mjs
 *
 * Requires: google_reviews table with text_en, text_ja, text_th columns
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, appendFileSync, writeFileSync } from 'fs'

const envText = readFileSync('/Users/pon/kushmap/.env.local', 'utf8')
const env = Object.fromEntries(
  envText.split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
)

const MAPS_KEY = env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY']
const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const LOG_FILE = '/Users/pon/kushmap/scripts/reviews-log.txt'
writeFileSync(LOG_FILE, `=== KUSHMAP Google Reviews Import - ${new Date().toISOString()} ===\n`)

function log(msg) {
  console.log(msg)
  appendFileSync(LOG_FILE, msg + '\n')
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// Search for a place by name+city and return place_id + reviews in requested language
async function searchPlaceWithReviews(shop, languageCode) {
  const query = `${shop.name} ${shop.city} Thailand cannabis dispensary`
  const body = {
    textQuery: query,
    locationBias: {
      circle: { center: { latitude: shop.lat, longitude: shop.lng }, radius: 300.0 }
    },
    maxResultCount: 1,
    languageCode,
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': MAPS_KEY,
      'X-Goog-FieldMask': 'places.id,places.reviews',
      'Referer': 'https://kushmap.vercel.app/',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (data.error) {
    log(`  ⚠ API error for "${shop.name}" [${languageCode}]: ${data.error.message}`)
    return null
  }

  const place = data.places?.[0]
  if (!place) return null

  return {
    place_id: place.id,
    reviews: (place.reviews ?? []).map(r => ({
      author_name: r.authorAttribution?.displayName ?? null,
      rating: r.rating ?? null,
      text: r.text?.text ?? null,
      original_language: r.originalText?.languageCode ?? null,
      published_at: r.publishTime ?? null,
    })),
  }
}

async function fetchAllShops() {
  const all = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('shops')
      .select('id, name, city, lat, lng, google_place_id')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data?.length) break
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

async function main() {
  const allShops = await fetchAllShops().catch(err => { log(`FATAL: ${err.message}`); process.exit(1) })

  // Get shop IDs that already have google reviews
  const { data: existingReviews } = await supabase
    .from('google_reviews')
    .select('shop_id')
  const doneIds = new Set((existingReviews ?? []).map(r => r.shop_id))
  const shops = allShops.filter(s => !doneIds.has(s.id))

  log(`Total shops: ${allShops.length}, Already have reviews: ${doneIds.size}, To process: ${shops.length}\n`)

  const LANGUAGES = ['en', 'ja', 'th']
  let success = 0
  let failed = 0

  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i]

    try {
      // Fetch EN reviews first (to get place_id)
      const enResult = await searchPlaceWithReviews(shop, 'en')
      await sleep(300)

      if (!enResult?.place_id) {
        log(`  - [${i + 1}/${shops.length}] "${shop.name}": not found`)
        failed++
        continue
      }

      const placeId = enResult.place_id
      const enReviews = enResult.reviews

      if (!enReviews.length) {
        log(`  - [${i + 1}/${shops.length}] "${shop.name}": no reviews`)
        // Still save place_id
        await supabase.from('shops').update({ google_place_id: placeId }).eq('id', shop.id)
        failed++
        continue
      }

      // Fetch JA reviews
      const jaResult = await searchPlaceWithReviews(shop, 'ja')
      await sleep(300)
      const jaReviews = jaResult?.reviews ?? []

      // Fetch TH reviews
      const thResult = await searchPlaceWithReviews(shop, 'th')
      await sleep(300)
      const thReviews = thResult?.reviews ?? []

      // Save place_id to shop
      await supabase.from('shops').update({ google_place_id: placeId }).eq('id', shop.id)

      // Merge reviews by index (same author order per language)
      const rows = enReviews.map((enReview, idx) => ({
        shop_id: shop.id,
        google_place_id: placeId,
        author_name: enReview.author_name,
        rating: enReview.rating,
        text_en: enReview.text,
        text_ja: jaReviews[idx]?.text ?? null,
        text_th: thReviews[idx]?.text ?? null,
        original_language: enReview.original_language,
        published_at: enReview.published_at,
      }))

      const { error } = await supabase.from('google_reviews').insert(rows)
      if (error) {
        log(`  ✗ [${i + 1}/${shops.length}] "${shop.name}": insert error - ${error.message}`)
        failed++
      } else {
        log(`  ✓ [${i + 1}/${shops.length}] "${shop.name}": ${rows.length} review(s) [${placeId}]`)
        success++
      }
    } catch (err) {
      log(`  ✗ [${i + 1}/${shops.length}] "${shop.name}": ${err.message}`)
      failed++
    }

    await sleep(200)

    if ((i + 1) % 50 === 0) {
      log(`\n--- Progress: ${i + 1}/${shops.length} (${success} with reviews, ${failed} none/failed) ---\n`)
    }
  }

  log(`\n${'='.repeat(50)}`)
  log(`✅ DONE: ${success} shops with reviews, ${failed} without`)
  log(`${'='.repeat(50)}\n`)
}

main().catch(err => {
  log(`FATAL: ${err.message}`)
  process.exit(1)
})

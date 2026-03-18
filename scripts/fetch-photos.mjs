/**
 * Fetch Google Places photos for all shops and store in shop_images table.
 * Run: node scripts/fetch-photos.mjs
 *
 * Uses Places API (New) text search with photo field mask.
 * Stores photo URLs as: https://places.googleapis.com/v1/{photo_name}/media?key=...&maxWidthPx=800
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

const LOG_FILE = '/Users/pon/kushmap/scripts/photo-log.txt'
writeFileSync(LOG_FILE, `=== KUSHMAP Photo Import - ${new Date().toISOString()} ===\n`)

function log(msg) {
  console.log(msg)
  appendFileSync(LOG_FILE, msg + '\n')
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchPhotoForShop(shop) {
  const query = `${shop.name} ${shop.city} Thailand cannabis`
  const body = {
    textQuery: query,
    locationBias: {
      circle: { center: { latitude: shop.lat, longitude: shop.lng }, radius: 500.0 }
    },
    maxResultCount: 1,
    languageCode: 'en',
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': MAPS_KEY,
      'X-Goog-FieldMask': 'places.id,places.photos',
      'Referer': 'https://kushmap.vercel.app/',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (data.error) {
    log(`  ⚠ API error for "${shop.name}": ${data.error.message}`)
    return null
  }

  const place = data.places?.[0]
  if (!place?.photos?.length) return null

  // Return up to 3 photos
  return place.photos.slice(0, 3).map((photo, idx) => ({
    url: `https://places.googleapis.com/v1/${photo.name}/media?key=${MAPS_KEY}&maxWidthPx=800`,
    is_primary: idx === 0,
  }))
}

async function fetchAllShops() {
  const all = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('shops')
      .select('id, name, city, lat, lng')
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
  // Get shops that don't have images yet
  const allShops = await fetchAllShops().catch(err => { log(`FATAL: ${err.message}`); process.exit(1) })

  // Get shop IDs that already have images
  const { data: existingImages } = await supabase
    .from('shop_images')
    .select('shop_id')

  const doneIds = new Set((existingImages ?? []).map(i => i.shop_id))
  const shops = allShops.filter(s => !doneIds.has(s.id))

  log(`Total shops: ${allShops.length}, Already have photos: ${doneIds.size}, To process: ${shops.length}\n`)

  let success = 0
  let failed = 0

  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i]
    try {
      const photos = await fetchPhotoForShop(shop)
      if (photos?.length) {
        const rows = photos.map(p => ({ shop_id: shop.id, url: p.url, is_primary: p.is_primary }))
        const { error } = await supabase.from('shop_images').insert(rows)
        if (error) {
          log(`  ✗ [${i + 1}/${shops.length}] "${shop.name}": insert error - ${error.message}`)
          failed++
        } else {
          log(`  ✓ [${i + 1}/${shops.length}] "${shop.name}": ${photos.length} photo(s)`)
          success++
        }
      } else {
        log(`  - [${i + 1}/${shops.length}] "${shop.name}": no photos found`)
        failed++
      }
    } catch (err) {
      log(`  ✗ [${i + 1}/${shops.length}] "${shop.name}": ${err.message}`)
      failed++
    }

    // Rate limiting: ~200ms between requests
    await sleep(200)

    // Progress checkpoint every 50 shops
    if ((i + 1) % 50 === 0) {
      log(`\n--- Progress: ${i + 1}/${shops.length} (${success} success, ${failed} failed) ---\n`)
    }
  }

  log(`\n${'='.repeat(50)}`)
  log(`✅ DONE: ${success} shops with photos, ${failed} without`)
  log(`${'='.repeat(50)}\n`)
}

main().catch(err => {
  log(`FATAL: ${err.message}`)
  process.exit(1)
})

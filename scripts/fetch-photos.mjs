/**
 * Re-fetch shop photos via Google Places API and store in Supabase Storage.
 * Run: node scripts/fetch-photos.mjs
 *
 * 1. Get unique shop_ids from shop_images (2,865 shops)
 * 2. Extract Google Place ID from existing URLs
 * 3. Fetch fresh photo references via Places API (New) - Place Details
 * 4. Download actual image bytes
 * 5. Upload to Supabase Storage "shop-photos" bucket
 * 6. Update shop_images.url to permanent Supabase Storage URL
 * 7. Skip shops already migrated (url contains supabase.co/storage/v1)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, appendFileSync, writeFileSync } from 'fs'
import pLimit from 'p-limit'

const envText = readFileSync('/Users/pon/kushmap/.env.local', 'utf8')
const env = Object.fromEntries(
  envText.split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
)

const MAPS_KEY = env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY']
const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']
const BUCKET = 'shop-photos'
const MAX_PHOTOS_PER_SHOP = 5

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const LOG_FILE = '/Users/pon/kushmap/scripts/photo-migrate-log.txt'
writeFileSync(LOG_FILE, `=== KUSHMAP Photo Migration - ${new Date().toISOString()} ===\n`)

function log(msg) {
  console.log(msg)
  appendFileSync(LOG_FILE, msg + '\n')
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find(b => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`Failed to create bucket: ${error.message}`)
    log(`Created bucket "${BUCKET}"`)
  } else {
    log(`Bucket "${BUCKET}" already exists`)
  }
}

// Fetch all shop_images rows, grouped by shop_id
async function fetchAllImages() {
  const all = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('shop_images')
      .select('id, shop_id, url, is_primary')
      .order('shop_id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data?.length) break
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

function isAlreadyMigrated(url) {
  return url && url.includes('supabase.co/storage/v1')
}

// Extract Google Place ID from existing photo URL
function extractPlaceId(url) {
  const m = url?.match(/places\/([^/]+)\/photos/)
  return m ? m[1] : null
}

const REFERER = 'https://kushmap.vercel.app/'

// Fetch fresh photo references from Places API (New)
async function fetchPhotoRefs(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=en`
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': MAPS_KEY,
      'X-Goog-FieldMask': 'photos',
      'Referer': REFERER,
    },
  })
  if (!res.ok) {
    throw new Error(`Places API ${res.status}`)
  }
  const data = await res.json()
  return (data.photos || []).slice(0, MAX_PHOTOS_PER_SHOP)
}

// Download photo bytes from Places API photo media endpoint
async function downloadPhoto(photoName) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?key=${MAPS_KEY}&maxWidthPx=800&skipHttpRedirect=true`
  const res = await fetch(url, { headers: { 'Referer': REFERER } })
  if (!res.ok) {
    throw new Error(`Photo download ${res.status}`)
  }
  const data = await res.json()
  // skipHttpRedirect=true returns JSON with photoUri
  const photoUri = data.photoUri
  if (!photoUri) throw new Error('No photoUri in response')

  const imgRes = await fetch(photoUri)
  if (!imgRes.ok) throw new Error(`Image fetch ${imgRes.status}`)

  const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
  const buffer = Buffer.from(await imgRes.arrayBuffer())
  return { buffer, contentType }
}

// Upload to Supabase Storage and return public URL
async function uploadToStorage(shopId, index, buffer, contentType) {
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
  const path = `${shopId}/${index}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true })
  if (error) throw new Error(`Upload: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function processShop(shopId, rows, placeId, idx, total) {
  try {
    // Fetch fresh photo references
    const photoRefs = await fetchPhotoRefs(placeId)
    if (!photoRefs.length) {
      log(`  - [${idx}/${total}] ${shopId}: no photos from Places API`)
      return { success: 0, errors: 0 }
    }

    // Delete old rows and insert fresh ones
    const { error: delErr } = await supabase
      .from('shop_images')
      .delete()
      .eq('shop_id', shopId)
    if (delErr) {
      log(`  ✗ [${idx}/${total}] ${shopId}: delete old rows failed - ${delErr.message}`)
      return { success: 0, errors: 1 }
    }

    let ok = 0
    let err = 0

    for (let i = 0; i < photoRefs.length; i++) {
      try {
        const { buffer, contentType } = await downloadPhoto(photoRefs[i].name)
        if (buffer.length < 200) {
          err++
          continue
        }

        const publicUrl = await uploadToStorage(shopId, i, buffer, contentType)

        const { error: insErr } = await supabase
          .from('shop_images')
          .insert({
            shop_id: shopId,
            url: publicUrl,
            is_primary: i === 0,
          })
        if (insErr) {
          log(`  ✗ [${idx}/${total}] ${shopId} photo ${i}: insert failed - ${insErr.message}`)
          err++
        } else {
          ok++
        }
      } catch (e) {
        log(`  ✗ [${idx}/${total}] ${shopId} photo ${i}: ${e.message}`)
        err++
      }
    }

    return { success: ok, errors: err }
  } catch (e) {
    log(`  ✗ [${idx}/${total}] ${shopId}: ${e.message}`)
    return { success: 0, errors: 1 }
  }
}

async function main() {
  await ensureBucket()

  log('Fetching all shop_images rows...')
  const allImages = await fetchAllImages()
  log(`Total rows: ${allImages.length}`)

  // Group by shop_id
  const shopMap = new Map()
  for (const img of allImages) {
    if (!shopMap.has(img.shop_id)) {
      shopMap.set(img.shop_id, [])
    }
    shopMap.get(img.shop_id).push(img)
  }
  log(`Unique shops: ${shopMap.size}`)

  // Filter out already migrated shops (all URLs for that shop are supabase)
  const toProcess = []
  let alreadyDone = 0
  for (const [shopId, rows] of shopMap) {
    const allMigrated = rows.every(r => isAlreadyMigrated(r.url))
    if (allMigrated) {
      alreadyDone++
      continue
    }
    // Extract place ID from any row
    const placeId = rows.map(r => extractPlaceId(r.url)).find(Boolean)
    if (!placeId) {
      log(`  - ${shopId}: no Place ID found in URLs, skipping`)
      continue
    }
    toProcess.push({ shopId, rows, placeId })
  }

  log(`Already migrated: ${alreadyDone}, To process: ${toProcess.length}\n`)

  if (toProcess.length === 0) {
    log('Nothing to do.')
    return
  }

  const limit = pLimit(3)
  let totalSuccess = 0
  let totalErrors = 0
  let processed = 0

  const tasks = toProcess.map((item, i) =>
    limit(async () => {
      const { success, errors } = await processShop(
        item.shopId, item.rows, item.placeId, i + 1, toProcess.length
      )
      totalSuccess += success
      totalErrors += errors
      processed++

      if (processed % 100 === 0) {
        log(`\n--- Progress: ${processed}/${toProcess.length} shops | ${totalSuccess} photos ok, ${totalErrors} errors ---\n`)
      }
    })
  )

  await Promise.all(tasks)

  log(`\n${'='.repeat(50)}`)
  log(`DONE: ${processed} shops processed`)
  log(`  ${totalSuccess} photos uploaded to Supabase Storage`)
  log(`  ${totalErrors} errors`)
  log(`  ${alreadyDone} shops were already migrated`)
  log(`${'='.repeat(50)}\n`)
}

main().catch(err => {
  log(`FATAL: ${err.message}`)
  process.exit(1)
})

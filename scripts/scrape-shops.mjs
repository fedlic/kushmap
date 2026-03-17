import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { appendFileSync, writeFileSync } from 'fs'

// Load env
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

const LOG_FILE = '/Users/pon/kushmap/scripts/import-log.txt'
writeFileSync(LOG_FILE, `=== KUSHMAP Import Log - ${new Date().toISOString()} ===\n`)

function log(msg) {
  console.log(msg)
  appendFileSync(LOG_FILE, msg + '\n')
}

const CITIES = [
  { en: 'Bangkok',      th: 'กรุงเทพ',     lat: 13.7563, lng: 100.5018 },
  { en: 'Chiang Mai',   th: 'เชียงใหม่',    lat: 18.7883, lng: 98.9853  },
  { en: 'Pattaya',      th: 'พัทยา',        lat: 12.9236, lng: 100.8825 },
  { en: 'Phuket',       th: 'ภูเก็ต',       lat: 7.8804,  lng: 98.3923  },
  { en: 'Koh Samui',    th: 'เกาะสมุย',     lat: 9.5120,  lng: 100.0136 },
  { en: 'Hua Hin',      th: 'หัวหิน',       lat: 12.5684, lng: 99.9577  },
  { en: 'Krabi',        th: 'กระบี่',       lat: 8.0863,  lng: 98.9063  },
  { en: 'Koh Phangan',  th: 'เกาะพะงัน',   lat: 9.7379,  lng: 100.0136 },
  { en: 'Chiang Rai',   th: 'เชียงราย',     lat: 19.9105, lng: 99.8406  },
  { en: 'Pai',          th: 'ปาย',          lat: 19.3570, lng: 98.4416  },
  { en: 'Kanchanaburi', th: 'กาญจนบุรี',   lat: 14.0227, lng: 99.5328  },
  { en: 'Ayutthaya',    th: 'อยุธยา',       lat: 14.3532, lng: 100.5689 },
  { en: 'Koh Chang',    th: 'เกาะช้าง',    lat: 12.0936, lng: 102.3131 },
  { en: 'Koh Tao',      th: 'เกาะเต่า',    lat: 10.0956, lng: 99.8399  },
  { en: 'Rayong',       th: 'ระยอง',        lat: 12.6814, lng: 101.2816 },
]

const QUERIES = (city) => [
  `cannabis dispensary ${city.en}`,
  `weed shop ${city.en}`,
  `marijuana shop ${city.en}`,
  `ร้านกัญชา ${city.th}`,
  `cannabis ${city.en}`,
]

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function searchPlaces(query, lat, lng) {
  const results = []
  let pageToken = null
  let page = 0

  do {
    page++
    const body = {
      textQuery: query,
      locationBias: {
        circle: { center: { latitude: lat, longitude: lng }, radius: 50000.0 }
      },
      maxResultCount: 20,
      languageCode: 'en',
    }
    if (pageToken) body.pageToken = pageToken

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': MAPS_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,nextPageToken',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (data.error) {
      log(`  ⚠ API error: ${data.error.status} - ${data.error.message}`)
      break
    }

    const places = (data.places ?? []).map(p => ({
      place_id: p.id,
      name: p.displayName?.text ?? '',
      formatted_address: p.formattedAddress ?? '',
      geometry: { location: { lat: p.location?.latitude, lng: p.location?.longitude } },
      phone: p.nationalPhoneNumber ?? null,
      website: p.websiteUri ?? null,
    }))

    results.push(...places)
    pageToken = data.nextPageToken ?? null
    if (pageToken) await sleep(2000)
  } while (pageToken && page < 3)

  return results
}

async function upsertShop(place, city) {
  const lat = place.geometry?.location?.lat
  const lng = place.geometry?.location?.lng
  if (!lat || !lng) return false

  const shop = {
    name: place.name,
    address: place.formatted_address ?? '',
    city: city.en,
    lat,
    lng,
    phone: place.phone ?? null,
    website: place.website ?? null,
    price_range: 2,
    is_verified: false,
    is_premium: false,
  }

  // Check duplicate by name+lat+lng
  const { data: existing } = await supabase
    .from('shops')
    .select('id')
    .eq('name', shop.name)
    .eq('lat', lat)
    .eq('lng', lng)
    .maybeSingle()

  if (existing) return false

  const { error } = await supabase.from('shops').insert(shop)

  if (error) {
    log(`  ✗ Insert error for "${place.name}": ${error.message}`)
    return false
  }
  return true
}

async function main() {
  log(`\nStarting import with Google Places API`)
  log(`Cities: ${CITIES.length}, Queries per city: ${QUERIES(CITIES[0]).length}\n`)

  let totalInserted = 0
  const seenPlaceIds = new Set()

  for (const city of CITIES) {
    log(`\n📍 ${city.en} (${city.th})`)
    const queries = QUERIES(city)
    let cityInserted = 0

    for (let qi = 0; qi < queries.length; qi++) {
      const query = queries[qi]
      try {
        const places = await searchPlaces(query, city.lat, city.lng)
        const newPlaces = places.filter(p => !seenPlaceIds.has(p.place_id))
        newPlaces.forEach(p => seenPlaceIds.add(p.place_id))

        log(`  ${city.en} ${qi + 1}/${queries.length} "${query}": ${places.length} found (${newPlaces.length} new)`)

        for (const place of newPlaces) {
          const ok = await upsertShop(place, city)
          if (ok) cityInserted++
          await sleep(50)
        }
      } catch (err) {
        log(`  ✗ Query error: ${err.message}`)
      }
    }

    log(`  → ${city.en}: ${cityInserted} shops inserted`)
    totalInserted += cityInserted
    await sleep(500)
  }

  log(`\n${'='.repeat(50)}`)
  log(`✅ TOTAL: ${totalInserted} unique shops inserted`)
  log(`📁 Log saved to scripts/import-log.txt`)
  log(`${'='.repeat(50)}\n`)
}

main().catch(err => {
  log(`FATAL: ${err.message}`)
  process.exit(1)
})

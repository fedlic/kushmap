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

// Cities and sub-areas for broader coverage
const CITIES = [
  // Bangkok sub-areas
  { en: 'Bangkok',           th: 'กรุงเทพ',       lat: 13.7563, lng: 100.5018 },
  { en: 'Bangkok Sukhumvit', th: 'สุขุมวิท',       lat: 13.7440, lng: 100.5640 },
  { en: 'Bangkok Silom',     th: 'สีลม',           lat: 13.7274, lng: 100.5347 },
  { en: 'Bangkok Ekkamai',   th: 'เอกมัย',         lat: 13.7180, lng: 100.5860 },
  { en: 'Bangkok Asok',      th: 'อโศก',           lat: 13.7364, lng: 100.5601 },
  { en: 'Bangkok On Nut',    th: 'อ่อนนุช',        lat: 13.7026, lng: 100.5996 },
  { en: 'Bangkok Ari',       th: 'อารีย์',         lat: 13.7786, lng: 100.5446 },
  { en: 'Bangkok Ladprao',   th: 'ลาดพร้าว',       lat: 13.8140, lng: 100.5620 },
  { en: 'Bangkok Thonburi',  th: 'ธนบุรี',         lat: 13.7270, lng: 100.4760 },
  { en: 'Bangkok Bang Na',   th: 'บางนา',          lat: 13.6659, lng: 100.6085 },
  { en: 'Bangkok Ratchada',  th: 'รัชดา',          lat: 13.7700, lng: 100.5680 },
  { en: 'Bangkok Phrom Phong', th: 'พร้อมพงษ์',   lat: 13.7296, lng: 100.5690 },
  { en: 'Bangkok Nana',      th: 'นานา',           lat: 13.7404, lng: 100.5536 },
  // Chiang Mai areas
  { en: 'Chiang Mai',        th: 'เชียงใหม่',      lat: 18.7883, lng: 98.9853  },
  { en: 'Chiang Mai Nimman', th: 'นิมมาน',         lat: 18.8012, lng: 98.9680  },
  { en: 'Chiang Mai Old City', th: 'เมืองเก่า',    lat: 18.7883, lng: 98.9854  },
  // Phuket areas
  { en: 'Phuket',            th: 'ภูเก็ต',         lat: 7.8804,  lng: 98.3923  },
  { en: 'Phuket Patong',     th: 'ป่าตอง',         lat: 7.9061,  lng: 98.2992  },
  { en: 'Phuket Kata',       th: 'กะตะ',           lat: 7.8202,  lng: 98.2985  },
  { en: 'Phuket Rawai',      th: 'ราไวย์',         lat: 7.7816,  lng: 98.3287  },
  { en: 'Phuket Kamala',     th: 'กมลา',           lat: 7.9484,  lng: 98.2795  },
  { en: 'Phuket Karon',      th: 'กะรน',           lat: 7.8483,  lng: 98.2939  },
  { en: 'Phuket Town',       th: 'เมืองภูเก็ต',    lat: 7.8894,  lng: 98.3965  },
  // Pattaya areas
  { en: 'Pattaya',           th: 'พัทยา',          lat: 12.9236, lng: 100.8825 },
  { en: 'Pattaya Jomtien',   th: 'จอมเทียน',       lat: 12.8710, lng: 100.8790 },
  { en: 'Pattaya Central',   th: 'พัทยากลาง',      lat: 12.9320, lng: 100.8780 },
  { en: 'Pattaya North',     th: 'พัทยาเหนือ',     lat: 12.9600, lng: 100.8760 },
  // Islands and other areas
  { en: 'Koh Samui',         th: 'เกาะสมุย',       lat: 9.5120,  lng: 100.0136 },
  { en: 'Koh Samui Chaweng', th: 'หาดเฉวง',        lat: 9.5370,  lng: 100.0620 },
  { en: 'Koh Samui Lamai',   th: 'หาดละไม',        lat: 9.4760,  lng: 100.0610 },
  { en: 'Koh Phangan',       th: 'เกาะพะงัน',      lat: 9.7379,  lng: 100.0136 },
  { en: 'Koh Tao',           th: 'เกาะเต่า',       lat: 10.0956, lng: 99.8399  },
  { en: 'Koh Chang',         th: 'เกาะช้าง',       lat: 12.0936, lng: 102.3131 },
  { en: 'Koh Lanta',         th: 'เกาะลันตา',      lat: 7.6330,  lng: 99.0490  },
  { en: 'Koh Phi Phi',       th: 'เกาะพีพี',       lat: 7.7407,  lng: 98.7784  },
  { en: 'Hua Hin',           th: 'หัวหิน',         lat: 12.5684, lng: 99.9577  },
  { en: 'Krabi',             th: 'กระบี่',         lat: 8.0863,  lng: 98.9063  },
  { en: 'Krabi Ao Nang',     th: 'อ่าวนาง',        lat: 8.0316,  lng: 98.8179  },
  { en: 'Chiang Rai',        th: 'เชียงราย',       lat: 19.9105, lng: 99.8406  },
  { en: 'Pai',               th: 'ปาย',            lat: 19.3570, lng: 98.4416  },
  { en: 'Kanchanaburi',      th: 'กาญจนบุรี',      lat: 14.0227, lng: 99.5328  },
  { en: 'Ayutthaya',         th: 'อยุธยา',         lat: 14.3532, lng: 100.5689 },
  { en: 'Rayong',            th: 'ระยอง',          lat: 12.6814, lng: 101.2816 },
  { en: 'Udon Thani',        th: 'อุดรธานี',       lat: 17.4140, lng: 102.7870 },
  { en: 'Khon Kaen',         th: 'ขอนแก่น',        lat: 16.4419, lng: 102.8360 },
  { en: 'Pattani',           th: 'ปัตตานี',        lat: 6.8653,  lng: 101.2500 },
  { en: 'Hat Yai',           th: 'หาดใหญ่',        lat: 7.0062,  lng: 100.4747 },
]

const QUERIES = (city) => [
  `cannabis dispensary ${city.en}`,
  `weed shop ${city.en}`,
  `marijuana dispensary ${city.en}`,
  `ร้านกัญชา ${city.th}`,
  `cannabis store ${city.en}`,
  `420 shop ${city.en}`,
  `hemp shop ${city.en}`,
  `ganja shop ${city.en}`,
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
        circle: { center: { latitude: lat, longitude: lng }, radius: 30000.0 }
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
        'Referer': 'https://kushmap.vercel.app/',
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
    city: city.en.replace(/Bangkok .*/, 'Bangkok').replace(/Phuket .*/, 'Phuket').replace(/Pattaya .*/, 'Pattaya').replace(/Chiang Mai .*/, 'Chiang Mai').replace(/Koh Samui .*/, 'Koh Samui').replace(/Krabi .*/, 'Krabi'),
    lat,
    lng,
    phone: place.phone ?? null,
    website: place.website ?? null,
    google_place_id: place.place_id,
    price_range: 2,
    is_verified: false,
    is_premium: false,
  }

  // Check duplicate by google_place_id first
  if (place.place_id) {
    const { data: existing } = await supabase
      .from('shops')
      .select('id')
      .eq('google_place_id', place.place_id)
      .maybeSingle()
    if (existing) return false
  }

  // Fallback: check by name+lat+lng
  const { data: existing2 } = await supabase
    .from('shops')
    .select('id')
    .eq('name', shop.name)
    .eq('lat', lat)
    .eq('lng', lng)
    .maybeSingle()

  if (existing2) {
    // Update place_id if missing
    if (place.place_id) {
      await supabase.from('shops').update({ google_place_id: place.place_id }).eq('id', existing2.id)
    }
    return false
  }

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

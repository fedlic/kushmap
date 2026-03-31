/**
 * Set a shop as premium.
 * Usage: node scripts/set-premium.mjs <shop_id_or_name> <months>
 * Example: node scripts/set-premium.mjs "SAMURAI WEED" 1
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envText = readFileSync('/Users/pon/kushmap/.env.local', 'utf8')
const env = Object.fromEntries(
  envText.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const [k, ...v] = l.split('=')
    return [k.trim(), v.join('=').trim()]
  })
)

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'])

const target = process.argv[2]
const months = parseInt(process.argv[3] || '1')

if (!target) {
  console.error('Usage: node scripts/set-premium.mjs <shop_id_or_name> <months>')
  process.exit(1)
}

// Try by ID first, then by name
let { data: shop } = await supabase
  .from('shops')
  .select('id, name, city, is_premium')
  .eq('id', target)
  .maybeSingle()

if (!shop) {
  const { data } = await supabase
    .from('shops')
    .select('id, name, city, is_premium')
    .ilike('name', `%${target}%`)
    .limit(1)
  shop = data?.[0] ?? null
}

if (!shop) {
  console.error(`Shop not found: "${target}"`)
  process.exit(1)
}

const expiresAt = new Date()
expiresAt.setMonth(expiresAt.getMonth() + months)

// Try with premium_expires_at first, fallback to is_premium only
let { error } = await supabase
  .from('shops')
  .update({
    is_premium: true,
    premium_expires_at: expiresAt.toISOString(),
  })
  .eq('id', shop.id)

if (error && (error.code === '42703' || error.message?.includes('premium_expires_at'))) {
  // Column doesn't exist yet, update is_premium only
  const res = await supabase
    .from('shops')
    .update({ is_premium: true })
    .eq('id', shop.id)
  error = res.error
  console.log('Note: premium_expires_at column not found. Run scripts/premium-schema.sql first.')
}

if (error) {
  console.error('Update failed:', error.message)
  process.exit(1)
}

console.log(`Premium activated!`)
console.log(`  Shop: ${shop.name} (${shop.city})`)
console.log(`  ID: ${shop.id}`)
console.log(`  Duration: ${months} month(s)`)
console.log(`  Expires: ${expiresAt.toISOString()}`)

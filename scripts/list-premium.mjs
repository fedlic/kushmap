/**
 * List all premium shops with expiration dates.
 * Usage: node scripts/list-premium.mjs
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

const { data: shops, error } = await supabase
  .from('shops')
  .select('id, name, city, is_premium, premium_expires_at, premium_contact')
  .eq('is_premium', true)
  .order('premium_expires_at', { ascending: true })

if (error) {
  console.error('Query failed:', error.message)
  process.exit(1)
}

if (!shops?.length) {
  console.log('No premium shops found.')
  process.exit(0)
}

console.log(`\nPremium Shops (${shops.length}):\n`)
console.log('Name'.padEnd(35) + 'City'.padEnd(20) + 'Expires'.padEnd(25) + 'Contact')
console.log('-'.repeat(100))

const now = new Date()
for (const s of shops) {
  const expires = s.premium_expires_at ? new Date(s.premium_expires_at) : null
  const expired = expires && expires < now
  const expiresStr = expires
    ? `${expires.toLocaleDateString('en-US')}${expired ? ' (EXPIRED)' : ''}`
    : 'No expiry'
  console.log(
    s.name.slice(0, 33).padEnd(35) +
    (s.city || '').slice(0, 18).padEnd(20) +
    expiresStr.padEnd(25) +
    (s.premium_contact || '-')
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Star, X, Clock } from 'lucide-react'
import { fetchPremiumShops, searchShopsForPremium, setPremiumStatus } from '@/lib/supabase/admin-queries'
import type { PremiumShop } from '@/lib/supabase/admin-queries'

function StatusBadge({ shop }: { shop: PremiumShop }) {
  if (!shop.is_premium) return null
  const expires = shop.premium_expires_at ? new Date(shop.premium_expires_at) : null
  const isExpired = expires && expires < new Date()
  if (isExpired) {
    return <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">Expired</span>
  }
  return <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">Active</span>
}

function formatDate(d: string | null) {
  if (!d) return 'No expiry'
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function daysRemaining(d: string | null) {
  if (!d) return null
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  return `${diff}d left`
}

export default function PremiumTab() {
  const [premiumShops, setPremiumShops] = useState<PremiumShop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PremiumShop[]>([])
  const [searching, setSearching] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [months, setMonths] = useState(1)
  const [contact, setContact] = useState('')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const loadPremium = useCallback(async () => {
    setLoading(true)
    const data = await fetchPremiumShops()
    setPremiumShops(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadPremium() }, [loadPremium])

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const data = await searchShopsForPremium(q)
    setSearchResults(data.filter(s => !s.is_premium))
    setSearching(false)
  }

  const handleActivate = async (shop: PremiumShop) => {
    setSaving(true)
    const { error } = await setPremiumStatus(shop.id, true, months, contact)
    if (error) alert(error)
    else {
      setSearchQuery('')
      setSearchResults([])
      setContact('')
      setMonths(1)
      setShowAdd(false)
      await loadPremium()
    }
    setSaving(false)
  }

  const handleRemove = async (shopId: string) => {
    const { error } = await setPremiumStatus(shopId, false)
    if (error) alert(error)
    else {
      setRemoving(null)
      await loadPremium()
    }
  }

  const handleExtend = async (shop: PremiumShop) => {
    setSaving(true)
    // Extend from current expiry (or now if expired/no expiry)
    const base = shop.premium_expires_at ? new Date(shop.premium_expires_at) : new Date()
    if (base < new Date()) base.setTime(Date.now())
    base.setMonth(base.getMonth() + 1)
    const supabase = (await import('@/lib/supabase/client')).createClient()
    const { error } = await supabase
      .from('shops')
      .update({ is_premium: true, premium_expires_at: base.toISOString() })
      .eq('id', shop.id)
    if (error) alert(error.message)
    else await loadPremium()
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-black text-yellow-600">{premiumShops.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active Premium</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-black text-red-600">
            {premiumShops.filter(s => s.premium_expires_at && new Date(s.premium_expires_at) < new Date()).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Expired</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-black text-green-600">
            {premiumShops.filter(s => {
              if (!s.premium_expires_at) return false
              const days = Math.ceil((new Date(s.premium_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return days > 0 && days <= 7
            }).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Expiring Soon</p>
        </div>
      </div>

      {/* Add premium shop */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Add Premium Shop</h3>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            {showAdd ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showAdd && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search shop name..."
                className="w-full h-9 pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Duration</label>
                <select
                  value={months}
                  onChange={e => setMonths(Number(e.target.value))}
                  className="h-8 px-2 border border-gray-300 rounded text-xs bg-white"
                >
                  {[1, 3, 6, 12].map(m => (
                    <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 block mb-1">Contact (optional)</label>
                <input
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="LINE ID, email, etc."
                  className="w-full h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />
              </div>
            </div>

            {searching && <p className="text-xs text-gray-400">Searching...</p>}

            {searchResults.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {searchResults.map(shop => (
                  <div key={shop.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{shop.name}</p>
                      <p className="text-[10px] text-gray-400">{shop.city}</p>
                    </div>
                    <button
                      onClick={() => handleActivate(shop)}
                      disabled={saving}
                      className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 disabled:opacity-50 font-medium"
                    >
                      {saving ? '...' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && !searching && searchResults.length === 0 && (
              <p className="text-xs text-gray-400">No non-premium shops found</p>
            )}
          </div>
        )}
      </div>

      {/* Premium shop list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Premium Shops</h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : premiumShops.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No premium shops</p>
        ) : (
          <div className="space-y-1.5">
            {premiumShops.map(shop => {
              const expires = shop.premium_expires_at ? new Date(shop.premium_expires_at) : null
              const isExpired = expires && expires < new Date()

              return (
                <div
                  key={shop.id}
                  className={`bg-white rounded-lg border px-4 py-3 flex items-center gap-4 ${
                    isExpired ? 'border-red-200 bg-red-50/30' : 'border-yellow-200'
                  }`}
                >
                  <Star className={`w-4 h-4 shrink-0 ${isExpired ? 'text-red-400' : 'text-yellow-500 fill-yellow-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900 truncate">{shop.name}</span>
                      <StatusBadge shop={shop} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{shop.city}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(shop.premium_expires_at)}
                        {daysRemaining(shop.premium_expires_at) && (
                          <span className={isExpired ? 'text-red-500' : 'text-green-600'}>
                            ({daysRemaining(shop.premium_expires_at)})
                          </span>
                        )}
                      </span>
                      {shop.premium_contact && (
                        <>
                          <span>·</span>
                          <span>{shop.premium_contact}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleExtend(shop)}
                      disabled={saving}
                      className="text-[10px] px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 font-medium"
                    >
                      +1mo
                    </button>
                    {removing === shop.id ? (
                      <>
                        <button
                          onClick={() => handleRemove(shop.id)}
                          className="text-[10px] px-2 py-1 bg-red-600 text-white rounded"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setRemoving(null)}
                          className="text-[10px] px-2 py-1 text-gray-500"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setRemoving(shop.id)}
                        className="text-[10px] px-2 py-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

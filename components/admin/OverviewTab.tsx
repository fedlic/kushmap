'use client'

import { useState, useEffect } from 'react'
import { fetchAdminStats } from '@/lib/supabase/admin-queries'
import type { AdminStats } from '@/lib/supabase/admin-queries'

const STAT_CARDS = [
  { key: 'totalShops', label: 'ショップ数', color: 'text-green-700 bg-green-50' },
  { key: 'totalReviews', label: 'レビュー数', color: 'text-blue-700 bg-blue-50' },
  { key: 'totalBookmarks', label: 'ブックマーク数', color: 'text-purple-700 bg-purple-50' },
  { key: 'hiddenShops', label: '非表示', color: 'text-gray-700 bg-gray-100' },
  { key: 'flaggedReviews', label: 'フラグ付き', color: 'text-red-700 bg-red-50' },
] as const

export default function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => { fetchAdminStats().then(setStats) }, [])

  if (!stats) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {STAT_CARDS.map(c => (
          <div key={c.key} className={`rounded-xl p-4 ${c.color}`}>
            <p className="text-[10px] opacity-70">{c.label}</p>
            <p className="text-xl font-bold mt-1">{(stats[c.key] as number).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {stats.topCities.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">都市別 Top 10</h3>
          <div className="space-y-1.5">
            {stats.topCities.map(({ city, count }) => (
              <div key={city} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-28 truncate">{city}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(count / stats.topCities[0].count) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

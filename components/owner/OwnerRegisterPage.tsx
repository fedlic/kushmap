'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, MapPin, ArrowLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { searchShopsForClaim, claimShop } from '@/lib/supabase/owner-queries'
import type { Shop } from '@/types'
import type { User } from '@supabase/supabase-js'
import AuthModal from '@/components/auth/AuthModal'

export default function OwnerRegisterPage() {
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Shop[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Shop | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    const shops = await searchShopsForClaim(q)
    setResults(shops)
    setSearching(false)
  }

  const handleClaim = async () => {
    if (!user) { setShowAuth(true); return }
    if (!selected) return
    setClaiming(true)
    setError('')
    const { error } = await claimShop(selected.id, user.id)
    if (error) {
      setError(error.includes('duplicate') ? 'このショップはすでに登録済みです' : error)
    } else {
      setDone(true)
      setTimeout(() => router.push('/owner/dashboard'), 2000)
    }
    setClaiming(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setShowAuth(false)
          supabase.auth.getUser().then(({ data }) => setUser(data.user))
        }}
      />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            トップへ
          </Link>
          <span className="text-gray-300">·</span>
          <span className="font-bold text-gray-900">ショップオーナー登録</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            ショップを登録するには
            <button onClick={() => setShowAuth(true)} className="underline font-medium mx-1">ログイン</button>
            が必要です
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h1 className="text-lg font-bold text-gray-900">あなたのショップを探す</h1>
          <p className="text-sm text-gray-500">店舗名で検索して、オーナーとして登録してください</p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="店舗名を入力..."
              className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {searching && <p className="text-sm text-gray-400 text-center">検索中...</p>}

          {results.length > 0 && !selected && (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {results.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => setSelected(shop)}
                  className="w-full flex items-start gap-3 p-4 hover:bg-green-50 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {shop.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{shop.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{shop.city}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && !done && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900">選択中のショップ</h2>
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold shrink-0">
                {selected.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{selected.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />{selected.city} · {selected.address}
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { setSelected(null); setResults([]) }}
                className="flex-1 h-10 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                選び直す
              </button>
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {claiming ? '登録中...' : 'オーナーとして登録する'}
              </button>
            </div>
          </div>
        )}

        {done && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-bold text-gray-900">登録完了しました！</p>
            <p className="text-sm text-gray-500">ダッシュボードへ移動します...</p>
          </div>
        )}
      </div>
    </div>
  )
}

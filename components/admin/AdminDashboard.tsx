'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, Store, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { checkIsAdmin } from '@/lib/supabase/admin-queries'
import type { User } from '@supabase/supabase-js'
import AuthModal from '@/components/auth/AuthModal'

const OverviewTab = dynamic(() => import('./OverviewTab'))
const ShopsTab = dynamic(() => import('./ShopsTab'))
const ReviewsTab = dynamic(() => import('./ReviewsTab'))

type Tab = 'overview' | 'shops' | 'reviews'

const TABS: { key: Tab; label: string; Icon: typeof BarChart3 }[] = [
  { key: 'overview', label: '概要', Icon: BarChart3 },
  { key: 'shops', label: 'ショップ', Icon: Store },
  { key: 'reviews', label: 'レビュー', Icon: MessageSquare },
]

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) setIsAdmin(await checkIsAdmin(data.user.id))
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AuthModal open onClose={() => router.push('/')} onSuccess={() => {
          supabase.auth.getUser().then(async ({ data }) => {
            setUser(data.user)
            if (data.user) setIsAdmin(await checkIsAdmin(data.user.id))
          })
        }} />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm mx-4 text-center space-y-3">
          <p className="text-red-600 font-bold">アクセス拒否</p>
          <p className="text-sm text-gray-500">管理者権限がありません</p>
          <Link href="/" className="inline-block text-sm text-green-600 hover:text-green-700">トップへ戻る</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />トップへ
            </Link>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-gray-900">管理者ダッシュボード</span>
          </div>
          <span className="text-xs text-gray-400">{user.email}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1">
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg flex-1 justify-center ${
                tab === key ? 'bg-green-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab />}
        {tab === 'shops' && <ShopsTab />}
        {tab === 'reviews' && <ReviewsTab />}
      </div>
    </div>
  )
}

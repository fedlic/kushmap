'use client'

import { useState, useEffect } from 'react'

export default function AgeGate() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const verified = localStorage.getItem('kushmap_age_verified')
    if (!verified) setShow(true)
  }, [])

  if (!show) return null

  const handleYes = () => {
    localStorage.setItem('kushmap_age_verified', '1')
    setShow(false)
  }

  const handleNo = () => {
    window.location.href = 'https://www.google.com'
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center shadow-2xl">
        <div className="text-4xl mb-3">🌿</div>
        <h2 className="text-2xl font-black text-green-700 tracking-tight mb-1">KUSHMAP</h2>
        <p className="text-xs text-gray-400 mb-6">Thailand Cannabis Dispensary Directory</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-gray-800 mb-1">年齢確認</p>
          <p className="text-sm text-gray-600">あなたは18歳以上ですか？</p>
          <p className="text-xs text-gray-400 mt-1">Are you 18 years or older?</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleNo}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            いいえ / No
          </button>
          <button
            onClick={handleYes}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
          >
            はい / Yes
          </button>
        </div>

        <p className="text-[10px] text-gray-400 mt-4">
          このサイトは成人向けのコンテンツを含みます
        </p>
      </div>
    </div>
  )
}

'use client'

import type { FilterType } from '@/types'

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: '全て' },
  { id: 'sativa', label: 'Sativa' },
  { id: 'indica', label: 'Indica' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'open', label: '営業中' },
  { id: 'top_rated', label: '高評価' },
]

interface FilterChipsProps {
  active: FilterType
  onChange: (f: FilterType) => void
}

export default function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            active === f.id
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

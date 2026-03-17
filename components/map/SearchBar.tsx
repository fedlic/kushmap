'use client'

import { useState, useRef } from 'react'
import { Search, LocateFixed, X } from 'lucide-react'

interface SearchBarProps {
  onSearch: (q: string) => void
  onLocate: () => void
}

export default function SearchBar({ onSearch, onLocate }: SearchBarProps) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const handleChange = (v: string) => {
    setValue(v)
    onSearch(v)
  }

  const clear = () => {
    setValue('')
    onSearch('')
    ref.current?.focus()
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={ref}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="ショップを検索..."
          className="w-full h-10 pl-9 pr-8 rounded-full border border-gray-200 bg-white text-sm shadow-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {value && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <button
        onClick={onLocate}
        className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
        title="現在地"
      >
        <LocateFixed className="w-4 h-4 text-green-600" />
      </button>
    </div>
  )
}

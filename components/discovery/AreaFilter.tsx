'use client'

export type Area = 'all' | 'sukhumvit' | 'silom' | 'khao_san' | 'chiang_mai' | 'phuket'

const AREAS: { id: Area; label: string; lat?: number; lng?: number }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'sukhumvit', label: 'Sukhumvit', lat: 13.7440, lng: 100.5570 },
  { id: 'silom', label: 'Silom', lat: 13.7274, lng: 100.5347 },
  { id: 'khao_san', label: 'Khao San', lat: 13.7589, lng: 100.4977 },
  { id: 'chiang_mai', label: 'Chiang Mai', lat: 18.7883, lng: 98.9853 },
  { id: 'phuket', label: 'Phuket', lat: 7.8804, lng: 98.3923 },
]

interface AreaFilterProps {
  active: Area
  onChange: (area: Area, lat?: number, lng?: number) => void
}

export default function AreaFilter({ active, onChange }: AreaFilterProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {AREAS.map((a) => (
        <button
          key={a.id}
          onClick={() => onChange(a.id, a.lat, a.lng)}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
            active === a.id
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-500'
          }`}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}

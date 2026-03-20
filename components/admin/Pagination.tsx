import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button onClick={() => onPage(page - 1)} disabled={page === 0} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-gray-500">{page + 1} / {total}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= total - 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

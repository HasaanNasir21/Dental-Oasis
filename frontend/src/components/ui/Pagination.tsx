import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '../../types'

interface Props {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export default function Pagination({ meta, onPageChange }: Props) {
  const { page, total_pages, total, page_size } = meta

  if (total_pages <= 1) return null

  const from = (page - 1) * page_size + 1
  const to = Math.min(page * page_size, total)

  return (
    <div className="flex items-center justify-between gap-4 mt-4">
      <p className="text-sm text-gray-400">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-3 py-1 text-sm text-gray-300">
          {page} / {total_pages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === total_pages}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import WishDetailDialog from './WishDetailDialog'
import { formatDate } from '@/lib/api'
import {
  Check, X, Clock, Trash2, ChevronLeft, ChevronRight,
  Search, FileText, CheckSquare, Square, MinusSquare, Loader2
} from 'lucide-react'

const FILTERS = [
  { label: 'Semua', value: null },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default function WishesTable({
  wishes, loading, filter, page = 1, pageSize = 20,
  totalCount, totalPages,
  searchQuery, onSearchChange,
  onFilterChange, onPageChange, onPageSizeChange, onUpdateStatus, onDelete,
  onBulkUpdateStatus, onBulkDelete
}) {
  const [selectedWish, setSelectedWish] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  const isControlledSearch = typeof onSearchChange === 'function'
  const currentSearch = isControlledSearch ? (searchQuery ?? '') : localSearchQuery

  const handleSearchChange = (val) => {
    if (isControlledSearch) {
      onSearchChange(val)
    } else {
      setLocalSearchQuery(val)
    }
  }

  const filteredWishes = useMemo(() => {
    if (isControlledSearch) return wishes
    if (!currentSearch.trim()) return wishes
    const q = currentSearch.toLowerCase()
    return wishes.filter(
      (w) =>
        (w.text && w.text.toLowerCase().includes(q)) ||
        (w.name && w.name.toLowerCase().includes(q)) ||
        (w.age_range && w.age_range.toLowerCase().includes(q)) ||
        String(w.id).toLowerCase().includes(q)
    )
  }, [wishes, currentSearch, isControlledSearch])

  const effectiveTotal = typeof totalCount === 'number' ? totalCount : filteredWishes.length
  const effectiveTotalPages = typeof totalPages === 'number' && totalPages > 0
    ? totalPages
    : Math.max(1, Math.ceil(effectiveTotal / pageSize))

  const from = effectiveTotal > 0 ? (page - 1) * pageSize + 1 : 0
  const to = effectiveTotal > 0 ? Math.min(page * pageSize, effectiveTotal) : 0

  // Selection helpers
  const allCurrentIds = useMemo(() => filteredWishes.map((w) => w.id), [filteredWishes])
  const isAllSelected = allCurrentIds.length > 0 && allCurrentIds.every((id) => selectedIds.includes(id))
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all current page items
      setSelectedIds((prev) => prev.filter((id) => !allCurrentIds.includes(id)))
    } else {
      // Select all current page items
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allCurrentIds])))
    }
  }

  const toggleSelectOne = (id, e) => {
    e.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const clearSelection = () => {
    setSelectedIds([])
  }

  const handleDelete = (id) => {
    setDeleteId(id)
    setSelectedWish(null)
  }

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setSelectedIds((prev) => prev.filter((id) => id !== deleteId))
      setDeleteId(null)
    }
  }

  const handleBulkAction = (newStatus) => {
    if (selectedIds.length === 0 || !onBulkUpdateStatus) return
    onBulkUpdateStatus(selectedIds, newStatus)
    clearSelection()
  }

  const confirmBulkDelete = () => {
    if (selectedIds.length === 0 || !onBulkDelete) return
    onBulkDelete(selectedIds)
    clearSelection()
    setBulkDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-3">
      {/* Floating / Embedded Bulk Action Bar when items selected */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-md animate-fade-in transition-colors">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{selectedIds.length}</span>
            <span className="text-zinc-600 dark:text-zinc-400">aspirasi dipilih</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleBulkAction('approved')}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Setujui ({selectedIds.length})
            </Button>

            <Button
              size="sm"
              onClick={() => handleBulkAction('pending')}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              Tandai Pending
            </Button>

            <Button
              size="sm"
              onClick={() => handleBulkAction('rejected')}
              variant="outline"
              className="h-8 text-xs border-zinc-200 dark:border-zinc-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Tolak
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="h-8 text-xs shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Hapus Massal
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="h-8 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Panel */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Segmented Controls */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950/70 p-1 rounded-md border border-zinc-200 dark:border-zinc-800 w-fit">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => {
                  onFilterChange(f.value)
                  handleSearchChange('')
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${filter === f.value
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Cari aspirasi, nama, usia, ID..."
              value={currentSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 font-mono text-xs select-none">
                {/* Select All Checkbox */}
                <th className="px-3 py-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    title={isAllSelected ? 'Batalkan pilihan semua' : 'Pilih semua di halaman ini'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                    ) : isSomeSelected ? (
                      <MinusSquare className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-3 w-12 font-mono">No</th>
                <th className="px-4 py-3 w-48">Pengunjung</th>
                <th className="px-4 py-3">Pesan Aspirasi</th>
                <th className="px-4 py-3 w-32">Status</th>
                <th className="px-4 py-3 w-40">Waktu Masuk</th>
                <th className="px-4 py-3 w-36 text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
              {!loading && filteredWishes.map((wish, index) => {
                const isSelected = selectedIds.includes(wish.id)
                return (
                  <tr
                    key={wish.id}
                    onClick={() => setSelectedWish(wish)}
                    className={`transition-colors cursor-pointer ${isSelected
                        ? 'bg-zinc-100/90 dark:bg-zinc-800/60'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                      }`}
                  >
                    {/* Row Checkbox */}
                    <td className="px-3 py-3.5 text-center" onClick={(e) => toggleSelectOne(wish.id, e)}>
                      <button
                        type="button"
                        className="p-1 rounded transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-zinc-400 dark:text-zinc-500" title={`ID UUID: ${wish.id}`}>
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                        {wish.name || 'Anonim'}
                      </div>
                      {wish.age_range && (
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {wish.age_range}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 max-w-md">
                      <p className="text-zinc-900 dark:text-zinc-200 line-clamp-2 leading-relaxed text-sm">
                        {wish.text}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={wish.status}>
                        {wish.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap font-mono">
                      {formatDate(wish.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {wish.status !== 'approved' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-zinc-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40"
                            title="Setujui (Approve)"
                            onClick={() => onUpdateStatus(wish.id, 'approved')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {wish.status !== 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:text-zinc-400 dark:hover:text-amber-400 dark:hover:bg-amber-950/40"
                            title="Tandai Pending"
                            onClick={() => onUpdateStatus(wish.id, 'pending')}
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        )}
                        {wish.status !== 'rejected' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40"
                            title="Tolak (Reject)"
                            onClick={() => onUpdateStatus(wish.id, 'rejected')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-950/40"
                          title="Hapus Data"
                          onClick={() => handleDelete(wish.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 font-mono text-xs gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              <span>Memuat data aspirasi...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredWishes.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <FileText className="w-7 h-7 text-zinc-400 dark:text-zinc-600 mx-auto opacity-50 stroke-[1.5]" />
              <div className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">Tidak ada aspirasi ditemukan</div>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {currentSearch
                  ? `Tidak ada hasil pencarian yang cocok untuk "${currentSearch}".`
                  : 'Belum ada data aspirasi pada filter status yang dipilih.'}
              </p>
            </div>
          )}
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange && onPageSizeChange(Number(e.target.value))
                  clearSelection()
                }}
                className="h-7 px-2 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer shadow-sm"
              >
                {[10, 20, 30, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} per hal
                  </option>
                ))}
              </select>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <div>
              {effectiveTotal === 0 ? (
                <span>Menampilkan <strong>0</strong> data</span>
              ) : (
                <span>
                  Menampilkan <strong>{from}–{to}</strong> dari <strong>{effectiveTotal.toLocaleString('id-ID')}</strong> data
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 font-mono">
            <button
              type="button"
              onClick={() => {
                onPageChange(1)
                clearSelection()
              }}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
              title="Halaman pertama"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => {
                onPageChange(Math.max(1, page - 1))
                clearSelection()
              }}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
              title="Halaman sebelumnya"
            >
              ‹
            </button>
            <span className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
              {page} / {effectiveTotalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                onPageChange(Math.min(effectiveTotalPages, page + 1))
                clearSelection()
              }}
              disabled={page >= effectiveTotalPages || loading}
              className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
              title="Halaman berikutnya"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => {
                onPageChange(effectiveTotalPages)
                clearSelection()
              }}
              disabled={page >= effectiveTotalPages || loading}
              className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm font-semibold cursor-pointer disabled:cursor-not-allowed"
              title="Halaman terakhir"
            >
              »
            </button>
          </div>

          <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Halaman {page} dari {effectiveTotalPages.toLocaleString('id-ID')}
          </div>
        </div>
      </Card>

      {/* Wish Detail Dialog */}
      <WishDetailDialog
        wish={selectedWish}
        open={!!selectedWish}
        onClose={() => setSelectedWish(null)}
        onUpdateStatus={(id, status) => {
          onUpdateStatus(id, status)
          setSelectedWish(null)
        }}
        onDelete={handleDelete}
      />

      {/* Confirmation Dialog for Single Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900 dark:text-zinc-100 text-base font-semibold">
              Hapus Aspirasi Ini?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              Data aspirasi ini akan dihapus secara permanen dari sistem dan tidak dapat dipulihkan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="h-9 text-sm">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="h-9 text-sm bg-rose-600 hover:bg-rose-700 text-white border-0"
            >
              Ya, Hapus Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Bulk Delete */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900 dark:text-zinc-100 text-base font-semibold">
              Hapus {selectedIds.length} Aspirasi Terpilih?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              Semua {selectedIds.length} data aspirasi yang dicentang akan dihapus secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="h-9 text-sm">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="h-9 text-sm bg-rose-600 hover:bg-rose-700 text-white border-0"
            >
              Ya, Hapus {selectedIds.length} Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

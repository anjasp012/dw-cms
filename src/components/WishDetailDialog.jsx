import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/api'
import { toast } from 'sonner'
import { Check, X, Trash2, Clock, Calendar, Hash, Copy, CheckCheck } from 'lucide-react'

export default function WishDetailDialog({ wish, open, onClose, onUpdateStatus, onDelete }) {
  const [copied, setCopied] = useState(false)

  if (!wish) return null

  const handleCopyUuid = () => {
    navigator.clipboard.writeText(wish.id)
    setCopied(true)
    toast.success('UUID berhasil disalin ke clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-5 pb-4 pr-12 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Detail Aspirasi
            </DialogTitle>
            <Badge variant={wish.status}>{wish.status}</Badge>
          </div>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Masuk pada {formatDate(wish.created_at)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Visitor Info: Nama & Rentang Usia */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">
                Nama Pengunjung
              </label>
              <div className="rounded-md bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {wish.name || 'Anonim'}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">
                Rentang Usia
              </label>
              <div className="rounded-md bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                {wish.age_range || '-'}
              </div>
            </div>
          </div>

          {/* Main Message Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400">
              Pesan Aspirasi Pengunjung
            </label>
            <div className="rounded-md bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-900 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
              {wish.text}
            </div>
          </div>

          {/* Full UUID Technical Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-zinc-500" />
                <span>ID UUID Lengkap</span>
              </label>
              <button
                type="button"
                onClick={handleCopyUuid}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-mono">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin UUID</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 font-mono text-xs text-zinc-800 dark:text-zinc-300 select-all break-all">
              {wish.id}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 h-9 text-sm"
            onClick={() => onDelete(wish.id)}
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Hapus
          </Button>

          <div className="flex items-center gap-2">
            {wish.status !== 'pending' && (
              <Button
                variant="warning"
                size="sm"
                className="h-9 text-sm"
                onClick={() => onUpdateStatus(wish.id, 'pending')}
              >
                <Clock className="w-4 h-4 mr-1.5" /> Pending
              </Button>
            )}
            {wish.status !== 'rejected' && (
              <Button
                variant="danger"
                size="sm"
                className="h-9 text-sm"
                onClick={() => onUpdateStatus(wish.id, 'rejected')}
              >
                <X className="w-4 h-4 mr-1.5" /> Reject
              </Button>
            )}
            {wish.status !== 'approved' && (
              <Button
                variant="success"
                size="sm"
                className="h-9 text-sm"
                onClick={() => onUpdateStatus(wish.id, 'approved')}
              >
                <Check className="w-4 h-4 mr-1.5" /> Approve
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

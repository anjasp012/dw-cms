import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, fetchWishes } from '@/lib/api'
import { toast } from 'sonner'
import StatsCards from './StatsCards'
import { 
  FileSpreadsheet, 
  FileCode, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock3, 
  XCircle, 
  Inbox,
  Filter,
  Loader2
} from 'lucide-react'

import { exportStyledExcel } from '@/lib/excelExport'

export default function ReportView({ analytics, wishes }) {
  const [exportFilter, setExportFilter] = useState('all')
  const [exporting, setExporting] = useState(false)

  const total = analytics.total_wishes || 0
  const approved = analytics.approved || 0
  const rejected = analytics.rejected || 0
  const pending = analytics.pending || (total - (approved + rejected))

  const approvedPct = total > 0 ? Math.round((approved / total) * 100) : 0
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0
  const rejectedPct = total > 0 ? Math.round((rejected / total) * 100) : 0

  const getExportData = async () => {
    const statusParam = exportFilter === 'all' ? null : exportFilter
    try {
      const data = await fetchWishes({ status: statusParam, limit: 200, offset: 0 })
      return data
    } catch (err) {
      throw new Error('Gagal mengambil data untuk laporan')
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const data = await getExportData()
      if (!data || data.length === 0) {
        toast.error('Tidak ada data untuk diekspor pada filter ini')
        return
      }

      const filterNames = {
        all: 'Semua Status (All)',
        approved: 'Approved (Disetujui)',
        pending: 'Pending (Menunggu Moderasi)',
        rejected: 'Rejected (Ditolak)'
      }

      exportStyledExcel({
        data,
        filterName: filterNames[exportFilter] || exportFilter
      })

      toast.success(`Dokumen Excel berhasil diunduh (${data.length} baris ber-styling)`)
    } catch (err) {
      toast.error(err.message || 'Gagal mengekspor berkas Excel')
    } finally {
      setExporting(false)
    }
  }

  const handleExportJSON = async () => {
    setExporting(true)
    try {
      const data = await getExportData()
      if (!data || data.length === 0) {
        toast.error('Tidak ada data untuk diekspor pada filter ini')
        return
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const dateStr = new Date().toISOString().split('T')[0]
      link.href = url
      link.setAttribute('download', `laporan_dreamwall_${exportFilter}_${dateStr}.json`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Data JSON berhasil diunduh (${data.length} record)`)
    } catch (err) {
      toast.error(err.message || 'Gagal mengekspor JSON')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Laporan & Ekspor Data
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ringkasan moderasi aspirasi serta ekspor berkas (Excel / JSON).
        </p>
      </div>

      {/* Summary Metrics */}
      <StatsCards analytics={analytics} />

      {/* Export Options Card */}
      <Card>
        <CardHeader className="p-5 pb-4">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <CardTitle className="text-sm font-semibold">Ekspor Berkas Data</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Pilih cakupan data yang ingin diekspor dan tentukan format unduhan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-5">
          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span>Cakupan Status Data:</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: `Semua Data (${total})` },
                { id: 'approved', label: `Hanya Approved (${approved})` },
                { id: 'pending', label: `Hanya Pending (${pending})` },
                { id: 'rejected', label: `Hanya Rejected (${rejected})` },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setExportFilter(item.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    exportFilter === item.id
                      ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold'
                      : 'bg-zinc-100/80 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Download Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              onClick={handleExportExcel}
              disabled={exporting}
              className="h-9 text-sm px-4 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              )}
              Unduh Dokumen Excel (.xls)
            </Button>

            <Button
              variant="outline"
              onClick={handleExportJSON}
              disabled={exporting}
              className="h-9 text-sm px-4"
            >
              <FileCode className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400" />
              Unduh Format JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview Table */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <CardTitle className="text-sm font-semibold">Pratinjau Data Laporan Terkini</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Cuplikan baris data aspirasi terbaru yang masuk dalam cakupan laporan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-600 dark:text-zinc-400 font-medium">
                  <th className="px-3 py-2.5 w-12 font-mono">No</th>
                  <th className="px-3 py-2.5">Pesan Aspirasi</th>
                  <th className="px-3 py-2.5 w-28">Status</th>
                  <th className="px-3 py-2.5 w-40">Tanggal Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                {wishes.slice(0, 8).map((wish, index) => (
                  <tr key={wish.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-zinc-400 dark:text-zinc-500">{index + 1}</td>
                    <td className="px-3 py-2.5 max-w-sm truncate text-zinc-900 dark:text-zinc-200">{wish.text}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={wish.status}>{wish.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {formatDate(wish.created_at)}
                    </td>
                  </tr>
                ))}
                {wishes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-500">
                      Belum ada data untuk ditampilkan dalam pratinjau.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import StatsCards from './StatsCards'
import WishesTable from './WishesTable'
import SettingsView from './SettingsView'
import ReportView from './ReportView'
import { 
  fetchAnalytics, 
  fetchWishes, 
  updateWishStatus, 
  deleteWish, 
  checkApiHealth,
  bulkUpdateWishStatus,
  bulkDeleteWishes
} from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { Toaster, toast } from 'sonner'
import { 
  Layers, 
  RotateCw, 
  LogOut, 
  Menu, 
  X, 
  Sliders, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  FileBarChart,
  Sun,
  Moon,
  Radio
} from 'lucide-react'

export default function Dashboard({ username, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Derive currentView from URL path
  const currentView = useMemo(() => {
    const path = location.pathname.replace(/^\//, '').toLowerCase()
    if (path === 'report' || path === 'reports') return 'report'
    if (path === 'settings' || path === 'setting') return 'settings'
    return 'wishes'
  }, [location.pathname])
  const [analytics, setAnalytics] = useState({ total_wishes: 0, approved: 0, rejected: 0, pending: 0 })
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)
  const [apiStatus, setApiStatus] = useState('checking')
  const [filter, setFilter] = useState(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { theme, isDark, toggleTheme } = useTheme()
  const isFetchingRef = useRef(false)

  const verifyHealth = useCallback(async () => {
    const isHealthy = await checkApiHealth()
    setApiStatus(isHealthy ? 'online' : 'offline')
  }, [])

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    if (isManualRefresh) setRefreshing(true)
    verifyHealth()
    try {
      const [analyticsData, wishesData] = await Promise.all([
        fetchAnalytics(),
        fetchWishes({ status: filter, limit: pageSize, offset: page * pageSize }),
      ])
      setAnalytics(analyticsData)
      setWishes(wishesData)
      setApiStatus('online')
      if (isManualRefresh) {
        toast.success('Data berhasil disinkronisasi')
      }
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        toast.error('Sesi login telah berakhir')
        onLogout()
      } else {
        setApiStatus('offline')
        if (isManualRefresh) {
          toast.error('Gagal mengambil data dari server')
        }
      }
    } finally {
      isFetchingRef.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter, page, pageSize, onLogout, verifyHealth])

  // Inisialisasi awal
  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

  // Auto-sync polling timer (Real-time background polling setiap 4 detik)
  useEffect(() => {
    if (!autoSyncEnabled) return

    const interval = setInterval(() => {
      // Background silent sync tanpa menampilkan skeleton/spinner
      loadData(false)
    }, 4000)

    return () => clearInterval(interval)
  }, [autoSyncEnabled, loadData])

  const handleUpdateStatus = async (wishId, newStatus) => {
    try {
      await updateWishStatus(wishId, newStatus)
      const labelMap = { approved: 'disetujui', rejected: 'ditolak', pending: 'ditandai pending' }
      toast.success(`Status record berhasil diubah ke ${labelMap[newStatus] || newStatus}`)
      loadData()
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') { onLogout(); return }
      toast.error(err.message || 'Gagal mengubah status data')
    }
  }

  const handleDelete = async (wishId) => {
    try {
      await deleteWish(wishId)
      toast.success('Record aspirasi berhasil dihapus')
      loadData()
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') { onLogout(); return }
      toast.error(err.message || 'Gagal menghapus data')
    }
  }

  const handleBulkUpdateStatus = async (ids, newStatus) => {
    try {
      const res = await bulkUpdateWishStatus(ids, newStatus)
      toast.success(res.message || `${ids.length} aspirasi berhasil diperbarui`)
      loadData()
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') { onLogout(); return }
      toast.error(err.message || 'Gagal memproses aksi massal')
    }
  }

  const handleBulkDelete = async (ids) => {
    try {
      const res = await bulkDeleteWishes(ids)
      toast.success(res.message || `${ids.length} aspirasi berhasil dihapus`)
      loadData()
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') { onLogout(); return }
      toast.error(err.message || 'Gagal menghapus data massal')
    }
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setPage(0)
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setPage(0)
  }

  const viewTitles = {
    wishes: 'Moderasi Aspirasi',
    report: 'Laporan & Ekspor',
    settings: 'Pengaturan Frontend',
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 antialiased font-sans transition-colors duration-200">
      <Toaster
        position="bottom-right"
        theme={theme}
        toastOptions={{
          className: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-sans shadow-xl',
        }}
      />

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white dark:bg-zinc-950/95 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-50 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Workspace Brand Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-zinc-100 dark:text-zinc-950 font-bold text-xs tracking-tighter">
              DW
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-200 tracking-tight leading-none">Dream Wall</span>
              <span className="text-[10px] text-zinc-500 font-mono mt-0.5">PANEL ADMIN</span>
            </div>
          </div>
          <button
            className="md:hidden text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1">
          <div className="px-2 pb-1.5 text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Menu Utama
          </div>

          {/* 1. Moderasi Aspirasi */}
          <button
            onClick={() => {
              navigate('/wishes')
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'wishes'
                ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span>Moderasi Aspirasi</span>
          </button>

          {/* 2. Laporan & Ekspor */}
          <button
            onClick={() => {
              navigate('/report')
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'report'
                ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileBarChart className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span>Laporan & Ekspor</span>
          </button>

          {/* 3. Pengaturan Frontend & Kuota */}
          <button
            onClick={() => {
              navigate('/settings')
              setSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'settings'
                ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span>Pengaturan Frontend</span>
          </button>

          {/* Documentation Section */}
          <div className="pt-4 px-2 pb-1.5 text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Pengembang
          </div>

          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-md text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-100/60 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>Swagger API Docs</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </div>

        {/* System & Connection Status Widget */}
        <div className="p-3 mx-3 mb-3 rounded-md bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">API BACKEND</span>
            {apiStatus === 'online' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            )}
            {apiStatus === 'offline' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                OFFLINE
              </span>
            )}
            {apiStatus === 'checking' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                CHECKING
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 font-mono truncate">
            http://127.0.0.1:8000
          </div>
        </div>

        {/* User Profile & Logout Section */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300 flex-shrink-0">
              {username ? username.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{username}</div>
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono leading-none">ADMINISTRATOR</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            title="Keluar (Logout)"
            className="h-8 w-8 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-14 px-5 sm:px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs">DREAMWALL</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-700" />
              <span className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{viewTitles[currentView]}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Auto-Sync Status Badge */}
            <button
              type="button"
              onClick={() => {
                const nextState = !autoSyncEnabled
                setAutoSyncEnabled(nextState)
                toast.info(nextState ? 'Sinkron otomatis diaktifkan' : 'Sinkron otomatis dijeda')
              }}
              title={autoSyncEnabled ? 'Sinkron Otomatis Aktif (Klik untuk menjeda)' : 'Sinkron Otomatis Dijeda (Klik untuk mengaktifkan)'}
              className={`hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-mono border transition-colors ${
                autoSyncEnabled 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60'
                  : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              <span>{autoSyncEnabled ? 'SINKRON OTOMATIS' : 'SINKRON DIJEDA'}</span>
            </button>

            {/* Direct Swagger API Docs Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('http://127.0.0.1:8000/docs', '_blank')}
              className="h-9 text-xs font-medium border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-zinc-500 dark:text-zinc-400" />
              API Docs
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-zinc-400 dark:text-zinc-500" />
            </Button>

            {/* Theme Toggle Button (Paling Kanan) */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title={isDark ? 'Ganti ke Tema Terang (Light Mode)' : 'Ganti ke Tema Gelap (Dark Mode)'}
              className="h-9 w-9 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-5 sm:p-8 space-y-6 flex-1">
          {currentView === 'wishes' && (
            <>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Pusat Moderasi Aspirasi
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Kelola dan moderasi pesan aspirasi pengunjung yang akan ditampilkan pada layar Dream Wall.
                </p>
              </div>

              <StatsCards analytics={analytics} />

              <WishesTable
                wishes={wishes}
                loading={loading}
                filter={filter}
                page={page}
                pageSize={pageSize}
                onFilterChange={handleFilterChange}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
                onBulkUpdateStatus={handleBulkUpdateStatus}
                onBulkDelete={handleBulkDelete}
              />
            </>
          )}

          {currentView === 'report' && (
            <ReportView analytics={analytics} wishes={wishes} />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </div>

        {/* Global Footer */}
        <footer className="px-8 py-4 border-t border-zinc-200 dark:border-zinc-800/60 text-xs text-zinc-400 dark:text-zinc-600 flex items-center justify-between font-mono">
          <div>DREAM WALL · PANEL ADMIN</div>
          <div>SWAGGER: /docs</div>
        </footer>
      </main>
    </div>
  )
}

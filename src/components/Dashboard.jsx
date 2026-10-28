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
  BarChart3,
  Layers, 
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
} from 'lucide-react'

export default function Dashboard({ username, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Derive currentView from URL path
  const currentView = useMemo(() => {
    const path = location.pathname.replace(/^\//, '').toLowerCase()
    if (path === 'report' || path === 'reports') return 'report'
    if (path === 'settings' || path === 'setting') return 'settings'
    return 'dashboard'
  }, [location.pathname])

  const setCurrentView = useCallback((view) => {
    const routeMap = {
      'dashboard': '/dashboard',
      'report': '/report',
      'settings': '/settings',
    }
    navigate(routeMap[view] || '/dashboard')
  }, [navigate])

  const [analytics, setAnalytics] = useState({ total_wishes: 0, approved: 0, rejected: 0, pending: 0 })
  const [wishes, setWishes] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState('checking')
  const [filter, setFilter] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { isDark, toggleTheme } = useTheme()
  const isFetchingRef = useRef(false)

  const viewTitles = {
    dashboard: 'Dashboard',
    report: 'Laporan & Ekspor Data',
    settings: 'Pengaturan Frontend',
  }

  // Debounce search input 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const verifyHealth = useCallback(async () => {
    const isHealthy = await checkApiHealth()
    setApiStatus(isHealthy ? 'online' : 'offline')
  }, [])

  const loadData = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    verifyHealth()
    try {
      const [analyticsData, wishesData] = await Promise.all([
        fetchAnalytics(),
        fetchWishes({
          status: filter,
          search: debouncedSearch,
          page,
          pageSize,
          paginated: true,
        }),
      ])
      setAnalytics(analyticsData)
      if (wishesData && wishesData.items) {
        setWishes(wishesData.items)
        setTotalCount(wishesData.total ?? 0)
        setTotalPages(wishesData.totalPages ?? 1)
      } else if (Array.isArray(wishesData)) {
        setWishes(wishesData)
        const count = filter ? wishesData.length : (analyticsData.total_wishes || wishesData.length)
        setTotalCount(count)
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)))
      }
      setApiStatus('online')
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        toast.error('Sesi login telah berakhir')
        onLogout()
      } else {
        setApiStatus('offline')
      }
    } finally {
      isFetchingRef.current = false
      setLoading(false)
    }
  }, [filter, debouncedSearch, page, pageSize, onLogout, verifyHealth])

  // Inisialisasi awal
  useEffect(() => {
    setLoading(true)
    loadData()
  }, [loadData])

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
    setPage(1)
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setPage(1)
  }

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      count: analytics.total_wishes,
    },
    {
      id: 'report',
      label: 'Laporan & Ekspor',
      icon: FileBarChart,
    },
    {
      id: 'settings',
      label: 'Pengaturan Frontend',
      icon: Sliders,
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Toaster position="bottom-right" richColors theme={isDark ? 'dark' : 'light'} />

      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Left Sidebar Dashboard (Aligned with RT-CMS exact layout) */}
      <aside
        className={`w-64 fixed inset-y-0 left-0 z-40 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center font-bold text-xs text-zinc-100 dark:text-zinc-900 shadow-sm flex-shrink-0">
                DW
              </div>
              <div>
                <div className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
                  DREAM WALL
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5 leading-none">ADMIN CMS</div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id)
                    setSidebarOpen(false)
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                    active
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {item.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Logout Section */}
        <div>
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
              <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs">DREAM WALL</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-700" />
              <span className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{viewTitles[currentView]}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Swagger API Docs Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`${import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8001'}/docs`, '_blank')}
              className="h-9 text-xs font-medium border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-zinc-500 dark:text-zinc-400" />
              API Docs
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-zinc-400 dark:text-zinc-500" />
            </Button>

            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title={isDark ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
              className="h-9 w-9 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </Button>
          </div>
        </header>

        {/* Dashboard Content Area */}
        <div className="p-5 sm:p-8 space-y-6 flex-1">
          {currentView === 'dashboard' && (
            <>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Dashboard
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
                totalCount={totalCount}
                totalPages={totalPages}
                searchQuery={search}
                onSearchChange={setSearch}
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
          <div>DREAM WALL · ADMIN CMS</div>
          <div>SWAGGER: /docs</div>
        </footer>
      </main>
    </div>
  )
}

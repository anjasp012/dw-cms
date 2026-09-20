import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { Loader2, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { isDark, toggleTheme } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setError('')
    setLoading(true)

    try {
      const data = await login(username, password)
      localStorage.setItem('dw_token', data.access_token)
      localStorage.setItem('dw_username', username)
      onLogin(username)
    } catch (err) {
      setError(err.message || 'Kredensial tidak valid')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-[#09090b] flex flex-col justify-between text-zinc-900 dark:text-zinc-100 relative overflow-hidden transition-colors duration-200">
      {/* Background Subtle Tech Grid */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#52525b 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-zinc-400/10 dark:bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-6 sm:px-10 py-5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-zinc-100 dark:text-zinc-950 font-bold text-xs tracking-tighter">
            DW
          </div>
          <div>
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Dream Wall</span>
            <span className="text-xs text-zinc-500 font-mono ml-2 uppercase px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">CMS</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            title={isDark ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
            className="text-zinc-600 dark:text-zinc-400"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </Button>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span>Panel Administrator</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[380px] space-y-5">
          {/* Headline */}
          <div className="space-y-1 text-center">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Masuk ke Panel Admin</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Masukkan akun admin untuk mengelola aspirasi.</p>
          </div>

          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
            <CardContent className="p-6">
              {error && (
                <div className="mb-4 p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
                  <div className="leading-snug">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-zinc-700 dark:text-zinc-300 text-xs font-medium">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <Input
                      id="username"
                      placeholder="Masukkan username"
                      className="pl-9 h-9 text-sm"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300 text-xs font-medium">Password</Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-9 pr-9 h-9 text-sm font-mono"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-9 mt-1 text-sm font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      Masuk Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 sm:px-10 py-4 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-600 border-t border-zinc-200 dark:border-zinc-800 font-mono">
        <div>DREAM WALL</div>
        <div>v1.0</div>
      </footer>
    </div>
  )
}

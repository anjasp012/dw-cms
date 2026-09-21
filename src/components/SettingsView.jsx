import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchSettings, saveSettings } from '@/lib/api'
import { toast } from 'sonner'
import { Check, Monitor, Loader2 } from 'lucide-react'

export default function SettingsView() {
  const [limit, setLimit] = useState('50')
  const [saving, setSaving] = useState(false)
  const [loadingSetting, setLoadingSetting] = useState(true)

  // Load current saved limit from backend database
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSettings()
        if (data && data.frontend_display_limit) {
          setLimit(String(data.frontend_display_limit))
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoadingSetting(false)
      }
    }
    load()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    const num = parseInt(limit)
    if (isNaN(num) || num <= 0) {
      toast.error('Limit harus berupa angka positif (min: 1)')
      return
    }
    setSaving(true)
    try {
      const res = await saveSettings(num)
      setLimit(String(res.frontend_display_limit))
      toast.success('Pengaturan berhasil diperbarui')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan ke server')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Pengaturan Frontend
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Konfigurasi jumlah pesan aspirasi yang disajikan pada layar Dream Wall.
        </p>
      </div>

      <div className="max-w-2xl">
        {/* Frontend Display Limit Card */}
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
          <CardHeader className="p-5 pb-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <CardTitle className="text-sm font-semibold">Pengaturan Frontend</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Atur batas jumlah pesan aspirasi yang disajikan pada layar Dream Wall.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="limit-input" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Aspirasi yang Ditampilkan
                </Label>
                <div className="max-w-xs">
                  <Input
                    id="limit-input"
                    type="number"
                    min="1"
                    placeholder="50"
                    disabled={loadingSetting}
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-full font-mono text-sm h-9"
                  />
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Tersimpan di tabel <code className="text-zinc-700 dark:text-zinc-300">app_settings</code>.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={saving || loadingSetting}
                  className="text-sm h-9 px-4 font-medium"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Simpan Pengaturan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


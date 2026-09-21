import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Inbox, CheckCircle2, Clock3, XCircle } from 'lucide-react'

function AnimatedCounter({ value }) {
  const ref = useRef(null)
  const prevValue = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const start = prevValue.current
    const end = value
    const duration = 500
    const startTime = performance.now()

    function step(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.round(start + (end - start) * eased)
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
    prevValue.current = end
  }, [value])

  return <span ref={ref}>0</span>
}

export default function StatsCards({ analytics }) {
  const total = analytics.total_wishes || 0
  const approved = analytics.approved || 0
  const rejected = analytics.rejected || 0
  const pending = analytics.pending || (total - (approved + rejected))

  const approvedPct = total > 0 ? Math.round((approved / total) * 100) : 0
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0
  const rejectedPct = total > 0 ? Math.round((rejected / total) * 100) : 0

  const items = [
    {
      label: 'Total Aspirasi',
      value: total,
      sub: 'Semua data masuk',
      icon: Inbox,
      iconBoxClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
    },
    {
      label: 'Disetujui',
      value: approved,
      sub: `${approvedPct}% dari total`,
      icon: CheckCircle2,
      iconBoxClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Pending',
      value: pending,
      sub: `${pendingPct}% perlu moderasi`,
      icon: Clock3,
      iconBoxClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Ditolak',
      value: rejected,
      sub: `${rejectedPct}% ditolak`,
      icon: XCircle,
      iconBoxClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card
            key={item.label}
            className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm"
          >
            <div className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {item.label}
                </span>
                <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                  <AnimatedCounter value={item.value} />
                </div>
                <span className="text-[11px] text-zinc-400 font-mono block">
                  {item.sub}
                </span>
              </div>
              <div className={`p-2.5 rounded-md ${item.iconBoxClass}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

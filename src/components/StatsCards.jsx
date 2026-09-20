import { useEffect, useRef } from 'react'
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
      iconColor: 'text-zinc-500 dark:text-zinc-400',
    },
    {
      label: 'Disetujui',
      value: approved,
      sub: `${approvedPct}% dari total`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Pending',
      value: pending,
      sub: `${pendingPct}% perlu moderasi`,
      icon: Clock3,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Ditolak',
      value: rejected,
      sub: `${rejectedPct}% ditolak`,
      icon: XCircle,
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{item.label}</span>
              <Icon className={`w-4 h-4 ${item.iconColor}`} />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
              <AnimatedCounter value={item.value} />
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {item.sub}
            </div>
          </div>
        )
      })}
    </div>
  )
}

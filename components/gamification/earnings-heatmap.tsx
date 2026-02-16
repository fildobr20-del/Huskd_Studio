"use client"

import { useState, useMemo, useRef } from "react"

function generateYearDays(): { date: string; dayOfWeek: number }[] {
  const days: { date: string; dayOfWeek: number }[] = []
  const now = new Date()
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push({ date: d.toISOString().split("T")[0], dayOfWeek: d.getDay() })
  }
  return days
}

function getColor(amount: number, avg: number): string {
  if (amount === 0) return "bg-white/[0.03]"
  if (amount < avg * 0.5) return "bg-violet-900/40"
  if (amount < avg) return "bg-violet-700/50"
  if (amount < avg * 2) return "bg-violet-500/70"
  return "bg-amber-400/80"
}

export function EarningsHeatmap() {
  const [tooltip, setTooltip] = useState<{ text: string; top: number; left: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const days = useMemo(() => generateYearDays(), [])
  const dayData: Record<string, number> = {}
  const activeDays = Object.values(dayData).filter((v) => v > 0).length
  const avg = activeDays > 0 ? Object.values(dayData).reduce((s, v) => s + v, 0) / activeDays : 0

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    const amt = dayData[days[i].date] || 0
    if (amt > 0) {
      tempStreak++
      if (currentStreak === 0 || i === days.length - 1 - currentStreak) currentStreak = tempStreak
    } else {
      if (tempStreak > longestStreak) longestStreak = tempStreak
      tempStreak = 0
    }
  }
  if (tempStreak > longestStreak) longestStreak = tempStreak

  const weeks: { date: string; dayOfWeek: number }[][] = []
  let currentWeek: { date: string; dayOfWeek: number }[] = []
  if (days[0]?.dayOfWeek > 0) {
    for (let i = 0; i < days[0].dayOfWeek; i++) {
      currentWeek.push({ date: "", dayOfWeek: i })
    }
  }
  for (const day of days) {
    currentWeek.push(day)
    if (day.dayOfWeek === 6) { weeks.push(currentWeek); currentWeek = [] }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  const handleMouseEnter = (e: React.MouseEvent, day: { date: string }) => {
    const amt = dayData[day.date] || 0
    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return
    setTooltip({
      text: `${day.date}: $${amt.toFixed(0)}${amt > 0 ? ` · +${(amt * 10).toFixed(0)} XP` : ""}`,
      top: rect.top - containerRect.top - 32,
      left: rect.left - containerRect.left + rect.width / 2,
    })
  }

  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6" ref={containerRef} style={{ position: "relative" }}>
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">Календарь доходов</h3>
        <p className="text-[11px] text-muted-foreground">365 дней — каждый квадрат = 1 день</p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-[2px]" style={{ minWidth: "600px" }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day, di) => {
                const amt = day.date ? (dayData[day.date] || 0) : -1
                if (amt === -1) return <div key={di} className="h-[11px] w-[11px]" />
                const color = getColor(amt, avg || 1)
                return (
                  <div
                    key={di}
                    className={`h-[11px] w-[11px] rounded-[2px] ${color} transition-all hover:ring-1 hover:ring-primary/40 cursor-pointer`}
                    onMouseEnter={(e) => handleMouseEnter(e, day)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {tooltip && (
        <div
          className="absolute z-50 -translate-x-1/2 rounded-lg bg-background/95 border border-border px-3 py-1.5 text-[11px] text-foreground shadow-lg pointer-events-none whitespace-nowrap"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          {tooltip.text}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span>🔥 Streak: <strong className="text-foreground">{currentStreak} дн.</strong></span>
          <span>🏆 Рекорд: <strong className="text-foreground">{longestStreak} дн.</strong></span>
          <span>📅 Активных: <strong className="text-foreground">{activeDays}</strong></span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Мало</span>
          <div className="h-[10px] w-[10px] rounded-[2px] bg-white/[0.03]" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-violet-900/40" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-violet-700/50" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-violet-500/70" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-amber-400/80" />
          <span>Jackpot</span>
        </div>
      </div>
    </div>
  )
}

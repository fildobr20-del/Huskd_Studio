"use client"

import { useState, useMemo, useRef, useEffect } from "react"

function generateYearDays(year: number): { date: string; dayOfWeek: number }[] {
  const days: { date: string; dayOfWeek: number }[] = []
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({ date: d.toISOString().split("T")[0], dayOfWeek: d.getDay() })
  }
  return days
}

function getColor(amount: number, avg: number): string {
  if (amount === 0) return "bg-white/[0.03]"
  if (amount < avg * 0.5) return "bg-violet-900/50"
  if (amount < avg) return "bg-violet-700/60"
  if (amount < avg * 2) return "bg-violet-500/80"
  return "bg-amber-400/90"
}

export function EarningsHeatmap({ ghostQuery = "" }: { ghostQuery?: string }) {
  const [tooltip, setTooltip] = useState<{ text: string; top: number; left: number } | null>(null)
  const [dayData, setDayData] = useState<Record<string, number>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const year = new Date().getFullYear()

  useEffect(() => {
    fetch(`/api/earnings-daily?year=${year}${ghostQuery ? "&" + ghostQuery.substring(1) : ""}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, number> = {}
        d.earnings?.forEach((e: any) => { map[e.date] = (map[e.date] || 0) + e.amount })
        setDayData(map)
      })
      .catch(() => {})
  }, [year])

  const days = useMemo(() => generateYearDays(year), [year])
  const activeDays = Object.values(dayData).filter(v => v > 0).length
  const avg = activeDays > 0 ? Object.values(dayData).reduce((s, v) => s + v, 0) / activeDays : 0

  // Streaks
  const today = new Date().toISOString().split("T")[0]
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  for (const day of days) {
    if (day.date > today) break
    if ((dayData[day.date] || 0) > 0) {
      tempStreak++
      if (tempStreak > longestStreak) longestStreak = tempStreak
    } else {
      tempStreak = 0
    }
  }
  // Current streak from today backwards
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].date > today) continue
    if ((dayData[days[i].date] || 0) > 0) currentStreak++
    else break
  }

  // Group by weeks
  const weeks: { date: string; dayOfWeek: number }[][] = []
  let currentWeek: { date: string; dayOfWeek: number }[] = []
  if (days[0]?.dayOfWeek > 0) {
    for (let i = 0; i < days[0].dayOfWeek; i++) currentWeek.push({ date: "", dayOfWeek: i })
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
    const dateObj = new Date(day.date)
    const label = dateObj.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    setTooltip({
      text: `${label}: $${amt.toFixed(2)}${amt > 0 ? ` · +${Math.round(amt * 10)} XP` : ""}`,
      top: rect.top - containerRect.top - 34,
      left: Math.min(Math.max(rect.left - containerRect.left + 5, 60), containerRect.width - 60),
    })
  }

  const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]

  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6" ref={containerRef} style={{ position: "relative" }}>
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">Календарь доходов {year}</h3>
        <p className="text-[11px] text-muted-foreground">Каждый квадрат = 1 день</p>
      </div>

      <div className="overflow-x-auto pb-2">
        {/* Month labels */}
        <div className="flex mb-1" style={{ minWidth: "600px", paddingLeft: "2px" }}>
          {months.map((m, i) => (
            <span key={i} className="text-[9px] text-muted-foreground/50" style={{ width: `${100/12}%` }}>{m}</span>
          ))}
        </div>
        <div className="flex gap-[2px]" style={{ minWidth: "600px" }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day, di) => {
                if (!day.date) return <div key={di} className="h-[11px] w-[11px]" />
                const amt = dayData[day.date] || 0
                const isFuture = day.date > today
                const color = isFuture ? "bg-white/[0.01]" : getColor(amt, avg || 1)
                return (
                  <div
                    key={di}
                    className={`h-[11px] w-[11px] rounded-[2px] ${color} transition-all ${!isFuture ? "hover:ring-1 hover:ring-primary/40 cursor-pointer" : ""}`}
                    onMouseEnter={!isFuture ? (e) => handleMouseEnter(e, day) : undefined}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {tooltip && (
        <div className="absolute z-50 -translate-x-1/2 rounded-lg bg-background/95 border border-border px-3 py-1.5 text-[11px] text-foreground shadow-lg pointer-events-none whitespace-nowrap" style={{ top: tooltip.top, left: tooltip.left }}>
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
          <div className="h-[10px] w-[10px] rounded-[2px] bg-violet-900/50" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-violet-700/60" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-violet-500/80" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-amber-400/90" />
          <span>Jackpot</span>
        </div>
      </div>
    </div>
  )
}

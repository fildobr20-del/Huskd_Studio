"use client"

import { useEffect, useState, useMemo } from "react"

function generateTopModelData(): number[] {
  // Generate 30 days of "top model" earnings between $4000-$7000
  const data: number[] = []
  for (let i = 0; i < 30; i++) {
    data.push(4000 + Math.random() * 3000)
  }
  return data
}

function getDayLabels(): string[] {
  const labels: string[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }))
  }
  return labels
}

export function GhostChart() {
  const [myEarnings, setMyEarnings] = useState(0)

  useEffect(() => {
    fetch("/api/balance")
      .then((r) => r.json())
      .then((d) => setMyEarnings(d.modelShare || 0))
      .catch(() => {})
  }, [])

  const topData = useMemo(() => generateTopModelData(), [])
  const labels = useMemo(() => getDayLabels(), [])

  // My data — spread current earnings across 30 days (simple avg)
  const myDaily = myEarnings / 30
  const myData = Array(30).fill(myDaily)

  const maxVal = Math.max(...topData, ...myData, 1)

  // SVG chart dimensions
  const w = 700
  const h = 200
  const pad = { top: 20, right: 10, bottom: 30, left: 50 }
  const chartW = w - pad.left - pad.right
  const chartH = h - pad.top - pad.bottom

  const toX = (i: number) => pad.left + (i / 29) * chartW
  const toY = (v: number) => pad.top + chartH - (v / maxVal) * chartH

  const topPath = topData.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ")
  const myPath = myData.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ")

  // Y axis ticks
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal]

  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">Ghost Chart</h3>
          <p className="text-[11px] text-muted-foreground">Сравнение с Топ-моделями агентства</p>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-primary rounded" /> Вы
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 border-t border-dashed border-muted-foreground/40" /> Уровень Топ-моделей
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: "500px" }}>
          {/* Grid lines */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={pad.left} y1={toY(v)} x2={w - pad.right} y2={toY(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={pad.left - 8} y={toY(v) + 4} fill="rgba(255,255,255,0.3)" fontSize={10} textAnchor="end">
                ${(v / 1000).toFixed(1)}k
              </text>
            </g>
          ))}

          {/* X axis labels (every 5th) */}
          {labels.filter((_, i) => i % 5 === 0).map((label, i) => (
            <text key={i} x={toX(i * 5)} y={h - 5} fill="rgba(255,255,255,0.3)" fontSize={9} textAnchor="middle">
              {label}
            </text>
          ))}

          {/* Top models line (dashed ghost) */}
          <path d={topPath} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} strokeDasharray="6 4" />

          {/* My earnings line */}
          <path d={myPath} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} />

          {/* Area under my line */}
          <path
            d={`${myPath} L ${toX(29)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`}
            fill="url(#ghostGrad)"
          />

          <defs>
            <linearGradient id="ghostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {myDaily < 4000 && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
          Топ-модели зарабатывают $4,000–$7,000 в день. Продолжай расти! 💪
        </p>
      )}
    </div>
  )
}

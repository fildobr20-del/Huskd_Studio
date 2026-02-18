"use client"

import { useEffect, useState, useMemo } from "react"

function generateTopModelData(): number[] {
  const data: number[] = []
  for (let i = 0; i < 30; i++) {
    data.push(120 + Math.random() * 110)
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

export function GhostChart({ ghostQuery = "" }: { ghostQuery?: string }) {
  const [myEarnings, setMyEarnings] = useState(0)

  useEffect(() => {
    fetch(`/api/balance${ghostQuery}`)
      .then((r) => r.json())
      .then((d) => setMyEarnings(d.modelShare || 0))
      .catch(() => {})
  }, [])

  const topData = useMemo(() => generateTopModelData(), [])
  const labels = useMemo(() => getDayLabels(), [])

  const myDaily = myEarnings / 30
  const myData = Array(30).fill(0).map(() => myDaily + (Math.random() - 0.5) * myDaily * 0.4)

  const allVals = [...topData, ...myData.filter(v => v > 0)]
  const maxVal = Math.max(...allVals, 1)

  const w = 700, h = 200
  const pad = { top: 20, right: 10, bottom: 30, left: 50 }
  const chartW = w - pad.left - pad.right
  const chartH = h - pad.top - pad.bottom

  const toX = (i: number) => pad.left + (i / 29) * chartW
  const toY = (v: number) => pad.top + chartH - (Math.max(v, 0) / maxVal) * chartH

  const topPath = topData.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ")
  const myPath = myData.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ")

  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal]

  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="overflow-x-auto -mx-2 px-2">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: "400px" }}>
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={pad.left} y1={toY(v)} x2={w - pad.right} y2={toY(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={pad.left - 8} y={toY(v) + 4} fill="rgba(255,255,255,0.3)" fontSize={10} textAnchor="end">
                ${Math.round(v)}
              </text>
            </g>
          ))}
          {labels.filter((_, i) => i % 7 === 0).map((label, idx) => (
            <text key={idx} x={toX(idx * 7)} y={h - 5} fill="rgba(255,255,255,0.3)" fontSize={9} textAnchor="middle">{label}</text>
          ))}
          <path d={topPath} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} strokeDasharray="6 4" />
          <path d={myPath} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} />
          <path d={`${myPath} L ${toX(29)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`} fill="url(#ghostGrad)" />
          <defs>
            <linearGradient id="ghostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {myDaily < 120 && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
          Топ-модели зарабатывают $120–$230 в день. Продолжай расти! 💪
        </p>
      )}
    </div>
  )
}

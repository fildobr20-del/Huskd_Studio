"use client"

import { useEffect, useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]

export function EarningsChart() {
  const [data, setData] = useState<{ month: string; earnings: number }[]>([])

  useEffect(() => {
    const year = new Date().getFullYear()
    fetch(`/api/earnings-daily?year=${year}`)
      .then(r => r.json())
      .then(d => {
        // Aggregate by month
        const byMonth: Record<number, number> = {}
        d.earnings?.forEach((e: any) => {
          const m = new Date(e.date).getMonth()
          byMonth[m] = (byMonth[m] || 0) + e.amount
        })
        // Build chart data for all months up to current
        const currentMonth = new Date().getMonth()
        const chartData = []
        for (let i = 0; i <= currentMonth; i++) {
          chartData.push({ month: monthNames[i], earnings: Math.round((byMonth[i] || 0) * 100) / 100 })
        }
        setData(chartData)
      })
      .catch(() => {})
  }, [])

  const hasData = data.some(d => d.earnings > 0)

  return (
    <div className="liquid-glass rounded-2xl p-5 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Monthly Earnings</h3>
          <p className="text-sm text-muted-foreground">Доход по месяцам {new Date().getFullYear()}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data.length > 0 ? data : monthNames.slice(0, new Date().getMonth() + 1).map(m => ({ month: m, earnings: 0 }))}>
          <defs>
            <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, "Доход"]}
          />
          <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" fill="url(#earnGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
      {!hasData && <p className="mt-2 text-center text-xs text-muted-foreground">Данные появятся после внесения доходов</p>}
    </div>
  )
}

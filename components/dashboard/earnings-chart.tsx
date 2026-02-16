"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { month: "Sep", earnings: 0, models: 0 },
  { month: "Oct", earnings: 0, models: 0 },
  { month: "Nov", earnings: 0, models: 0 },
  { month: "Dec", earnings: 0, models: 0 },
  { month: "Jan", earnings: 0, models: 0 },
  { month: "Feb", earnings: 0, models: 0 },
]

export function EarningsChart() {
  return (
    <div className="liquid-glass rounded-2xl p-5 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Monthly Earnings</h3>
          <p className="text-sm text-muted-foreground">Commission earnings over the last 6 months</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
          <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
          <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" fill="url(#earnGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-xs text-muted-foreground">Данные появятся когда модели начнут работать</p>
    </div>
  )
}

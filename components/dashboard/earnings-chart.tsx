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
  { month: "Sep", earnings: 3200, models: 18 },
  { month: "Oct", earnings: 4100, models: 19 },
  { month: "Nov", earnings: 3800, models: 20 },
  { month: "Dec", earnings: 5600, models: 21 },
  { month: "Jan", earnings: 4900, models: 22 },
  { month: "Feb", earnings: 6300, models: 23 },
]

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="liquid-glass-elevated rounded-2xl px-4 py-3 border border-foreground/10">
        <p className="mb-1.5 text-sm font-semibold text-foreground">{label}</p>
        <p className="text-sm text-emerald-400">
          {"Earnings: "}
          <span className="font-semibold">
            {"$"}
            {payload[0].value.toLocaleString()}
          </span>
        </p>
        {payload[1] && (
          <p className="text-sm text-violet-400">
            {"Models: "}
            <span className="font-semibold">{payload[1].value}</span>
          </p>
        )}
      </div>
    )
  }
  return null
}

export function EarningsChart() {
  return (
    <div className="relative overflow-hidden rounded-3xl liquid-glass liquid-shimmer h-full">
      {/* Top specular edge */}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-foreground/8 to-transparent"
      />
      {/* Internal color refraction */}
      <div
        aria-hidden="true"
        className="absolute -left-20 top-10 h-40 w-40 rounded-full bg-violet-500/[0.06] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-10 bottom-20 h-32 w-32 rounded-full bg-blue-500/[0.05] blur-3xl"
      />

      <div className="relative z-10 p-5">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Monthly Earnings
            </h2>
            <p className="text-sm text-muted-foreground">
              Commission earnings over the last 6 months
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
              <span className="text-xs text-muted-foreground">Earnings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              <span className="text-xs text-muted-foreground">Models</span>
            </div>
          </div>
        </div>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="earningsGrad3d"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(258, 90%, 66%)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="40%"
                    stopColor="hsl(258, 90%, 66%)"
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(258, 90%, 66%)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient
                  id="modelsGrad3d"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(217, 91%, 60%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="40%"
                    stopColor="hsl(217, 91%, 60%)"
                    stopOpacity={0.1}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(217, 91%, 60%)"
                    stopOpacity={0}
                  />
                </linearGradient>
                {/* Glow filter for area strokes */}
                <filter id="glowPurple">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(225, 8%, 50%)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(225, 8%, 50%)", fontSize: 12 }}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="hsl(258, 90%, 66%)"
                strokeWidth={2.5}
                fill="url(#earningsGrad3d)"
                filter="url(#glowPurple)"
              />
              <Area
                type="monotone"
                dataKey="models"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={2}
                fill="url(#modelsGrad3d)"
                yAxisId={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

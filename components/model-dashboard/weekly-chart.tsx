"use client";

import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const weeklyData = [
  { day: "Mon", earnings: 480 },
  { day: "Tue", earnings: 620 },
  { day: "Wed", earnings: 540 },
  { day: "Thu", earnings: 780 },
  { day: "Fri", earnings: 920 },
  { day: "Sat", earnings: 690 },
  { day: "Sun", earnings: 250 },
];

const ROSE_PINK = "hsl(346, 60%, 65%)";
const ROSE_PINK_DIM = "hsl(346, 40%, 50%)";

export function WeeklyChart() {
  const totalWeek = weeklyData.reduce((sum, d) => sum + d.earnings, 0);
  const bestDay = weeklyData.reduce((best, d) =>
    d.earnings > best.earnings ? d : best
  );

  return (
    <div className="glass-raised glass-highlight relative overflow-hidden rounded-2xl">
      <div className="relative z-10 flex items-center justify-between p-5 pb-2 md:p-6 md:pb-2">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Weekly Performance
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Last 7 days earnings
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold text-foreground">
            ${totalWeek.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Best: {bestDay.day} (${bestDay.earnings})
          </p>
        </div>
      </div>
      <div className="relative z-10 px-2 pb-4 md:px-4 md:pb-5">
        <ChartContainer
          config={{
            earnings: {
              label: "Earnings",
              color: ROSE_PINK,
            },
          }}
          className="h-[220px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="earningsGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={ROSE_PINK} stopOpacity={0.35} />
                  <stop offset="50%" stopColor={ROSE_PINK} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={ROSE_PINK} stopOpacity={0.0} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(240, 5%, 45%)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(240, 5%, 45%)", fontSize: 12 }}
                tickFormatter={(v) => `$${v}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`$${value}`, "Earnings"]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke={ROSE_PINK}
                strokeWidth={2.5}
                fill="url(#earningsGradient)"
                filter="url(#glow)"
                dot={{
                  fill: ROSE_PINK_DIM,
                  stroke: ROSE_PINK,
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  fill: ROSE_PINK,
                  stroke: "hsl(240, 6%, 7%)",
                  strokeWidth: 3,
                  r: 7,
                  style: {
                    filter: "drop-shadow(0 0 6px rgba(212,115,140,0.5))",
                  },
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}

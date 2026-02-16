"use client"

import { useEffect, useState } from "react"
import { DollarSign, Users, TrendingUp, Percent } from "lucide-react"

export function StatsCards() {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/balance")
      .then((r) => r.json())
      .then((d) => {
        setBalance(d.recruiterShare || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const stats = [
    {
      title: "Current Balance",
      value: loading ? "..." : `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      accent: "green" as const,
      description: "Available for withdrawal",
    },
    {
      title: "Active Models",
      value: "0",
      icon: Users,
      accent: "purple" as const,
      description: "Подключите моделей",
    },
    {
      title: "Lifetime Earnings",
      value: loading ? "..." : `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      accent: "blue" as const,
      description: "За текущий месяц",
    },
    {
      title: "Commission Rate",
      value: "10%",
      icon: Percent,
      accent: "purple" as const,
      description: "Standard recruiter tier",
    },
  ]

  const accentMap = {
    green: {
      iconBg: "bg-emerald-400/10",
      iconColor: "text-emerald-400",
      valueColor: "text-emerald-400",
      glowClass: "liquid-glow-green",
      borderAccent: "hover:border-emerald-400/20",
      orbColor: "bg-emerald-500/10",
    },
    purple: {
      iconBg: "bg-violet-400/10",
      iconColor: "text-violet-400",
      valueColor: "text-violet-400",
      glowClass: "liquid-glow-purple",
      borderAccent: "hover:border-violet-400/20",
      orbColor: "bg-violet-500/10",
    },
    blue: {
      iconBg: "bg-blue-400/10",
      iconColor: "text-blue-400",
      valueColor: "text-blue-400",
      glowClass: "liquid-glow-blue",
      borderAccent: "hover:border-blue-400/20",
      orbColor: "bg-blue-500/10",
    },
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const colors = accentMap[stat.accent]
        return (
          <div
            key={stat.title}
            className={`liquid-glass liquid-glass-hover liquid-shimmer relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${colors.glowClass} ${colors.borderAccent}`}
          >
            <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${colors.orbColor} opacity-60 blur-2xl`} />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                <div className={`rounded-xl p-2.5 ${colors.iconBg}`}>
                  <stat.icon className={`h-4 w-4 ${colors.iconColor}`} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-2xl font-bold tracking-tight ${colors.valueColor}`}>{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.description}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

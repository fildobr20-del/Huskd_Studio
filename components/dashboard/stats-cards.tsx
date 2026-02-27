"use client"

import { useEffect, useState } from "react"
import { DollarSign, Users, TrendingUp, Percent } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function StatsCards({ ghostQuery = "" }: { ghostQuery?: string }) {
  const [commission, setCommission] = useState(0)
  const [lifetime, setLifetime] = useState(0)
  const [modelCount, setModelCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [commRate, setCommRate] = useState(10)

  useEffect(() => {
    // Fetch recruiter models data
    fetch(`/api/recruiter-models${ghostQuery}`)
      .then((r) => r.json())
      .then((d) => {
        // currentBalance = gross commission minus already paid out (new field)
        // Fall back to recruiterCommission if currentBalance not yet in response
        setCommission(d.currentBalance ?? d.recruiterCommission ?? 0)
        setCommRate(d.commissionPercent || 10)
        setModelCount(d.totalModels || 0)
        setLoading(false)

        // Lifetime Earnings tracks gross commission (never decreases on payout)
        const grossCommission = d.recruiterCommission || 0
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from("profiles").select("total_lifetime_earnings").eq("id", user.id).single().then(({ data: prof }) => {
              const current = prof?.total_lifetime_earnings || 0
              if (grossCommission > current) {
                supabase.from("profiles").update({ total_lifetime_earnings: grossCommission }).eq("id", user.id)
              }
              setLifetime(Math.max(current, grossCommission))
            })
          }
        })
      })
      .catch(() => setLoading(false))
  }, [])

  const stats = [
    {
      title: "Current Balance",
      value: loading ? "..." : `$${commission.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign, accent: "green" as const,
      description: "К выводу",
    },
    {
      title: "Models",
      value: loading ? "..." : `${modelCount}`,
      icon: Users, accent: "purple" as const,
      description: modelCount > 0 ? "Привлечено" : "Поделитесь ссылкой",
    },
    {
      title: "Lifetime Earnings",
      value: loading ? "..." : `$${lifetime.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp, accent: "blue" as const,
      description: "За всё время",
    },
    {
      title: "Commission Rate",
      value: `${commRate}%`,
      icon: Percent, accent: "purple" as const,
      description: "Ваша ставка",
    },
  ]

  const accentMap = {
    green: { iconBg: "bg-emerald-400/10", iconColor: "text-emerald-400", valueColor: "text-emerald-400", glowClass: "liquid-glow-green", borderAccent: "hover:border-emerald-400/20", orbColor: "bg-emerald-500/10" },
    purple: { iconBg: "bg-violet-400/10", iconColor: "text-violet-400", valueColor: "text-violet-400", glowClass: "liquid-glow-purple", borderAccent: "hover:border-violet-400/20", orbColor: "bg-violet-500/10" },
    blue: { iconBg: "bg-blue-400/10", iconColor: "text-blue-400", valueColor: "text-blue-400", glowClass: "liquid-glow-blue", borderAccent: "hover:border-blue-400/20", orbColor: "bg-blue-500/10" },
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const colors = accentMap[stat.accent]
        return (
          <div key={stat.title} className={`liquid-glass liquid-glass-hover relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 ${colors.glowClass} ${colors.borderAccent}`}>
            <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${colors.orbColor} opacity-60 blur-2xl`} />
            <div className="relative z-10">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                <div className={`rounded-lg p-2 ${colors.iconBg}`}>
                  <stat.icon className={`h-3.5 w-3.5 ${colors.iconColor}`} />
                </div>
              </div>
              <span className={`text-xl font-bold tracking-tight sm:text-2xl ${colors.valueColor}`}>{stat.value}</span>
              <p className="mt-1 text-[11px] text-muted-foreground">{stat.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

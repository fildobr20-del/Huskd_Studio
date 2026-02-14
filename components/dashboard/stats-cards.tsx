"use client"

import { DollarSign, Users, TrendingUp, Percent } from "lucide-react"

const stats = [
  {
    title: "Current Balance",
    value: "$4,821.50",
    icon: DollarSign,
    accent: "green" as const,
    description: "Available for withdrawal",
  },
  {
    title: "Active Models",
    value: "23",
    icon: Users,
    accent: "purple" as const,
    description: "+3 this month",
  },
  {
    title: "Lifetime Earnings",
    value: "$48,392.00",
    icon: TrendingUp,
    accent: "blue" as const,
    description: "Since Jan 2024",
  },
  {
    title: "Commission Rate",
    value: "12%",
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

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const style = accentMap[stat.accent]
        const Icon = stat.icon
        return (
          <div
            key={stat.title}
            className={`group relative overflow-hidden rounded-3xl p-5 liquid-glass liquid-glass-hover liquid-shimmer ${style.glowClass} ${style.borderAccent} cursor-default`}
          >
            {/* Internal refraction orb */}
            <div
              aria-hidden="true"
              className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${style.orbColor} blur-2xl transition-transform duration-700 group-hover:scale-125`}
            />
            {/* Specular top-edge */}
            <div
              aria-hidden="true"
              className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-foreground/8 to-transparent"
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <div
                  className={`rounded-2xl p-2.5 ${style.iconBg} liquid-glass-inset transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <Icon className={`h-4 w-4 ${style.iconColor}`} />
                </div>
              </div>
              <p
                className={`mt-3 text-3xl font-bold tracking-tight ${style.valueColor}`}
              >
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

"use client"

import React from "react"
import { DashboardHeader } from "@/components/model-dashboard/header"
import { FinanceCards } from "@/components/model-dashboard/finance-cards"
import { PlatformBreakdown } from "@/components/model-dashboard/platform-breakdown"
import { WeeklyChart } from "@/components/model-dashboard/weekly-chart"
import { RecentFeed } from "@/components/model-dashboard/recent-feed"
import { Clock, Flame, Users } from "lucide-react"

export function ModelContent() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="ambient-orb-1 absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="ambient-orb-2 absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="ambient-orb-1 absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.02] blur-[80px]" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 md:gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground md:text-2xl">Welcome back, Alexa</h2>
                <p className="text-sm text-muted-foreground">{"Here's your earnings overview for February 2026"}</p>
              </div>
              <span className="glass-pill hidden rounded-full px-3.5 py-1.5 text-xs font-semibold text-primary md:inline-block">Premium Model</span>
            </div>
            <FinanceCards />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 md:gap-6">
              <div className="lg:col-span-3"><WeeklyChart /></div>
              <div className="lg:col-span-2"><PlatformBreakdown /></div>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 md:gap-6">
              <RecentFeed />
              <div className="flex flex-col gap-3 md:gap-4">
                <QuickStat label="Hours Online This Week" value="32.5 hrs" sub="Avg 4.6 hrs/day" icon={<Clock className="h-4 w-4" />} iconColor="text-blue-400" iconBg="bg-blue-400/10 border-blue-400/20" />
                <QuickStat label="Top Earning Day" value="Friday" sub="$920 earned" icon={<Flame className="h-4 w-4" />} iconColor="text-orange-400" iconBg="bg-orange-400/10 border-orange-400/20" />
                <QuickStat label="Active Regulars" value="18 fans" sub="+3 new this week" icon={<Users className="h-4 w-4" />} iconColor="text-primary" iconBg="bg-primary/10 border-primary/20" />
              </div>
            </div>
          </div>
        </main>
        <footer className="glass-header relative z-10 px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
          {"Husk'd Label"} &middot; Secure Dashboard &middot; All amounts in USD
        </footer>
      </div>
    </div>
  )
}

function QuickStat({ label, value, sub, icon, iconColor, iconBg }: { label: string; value: string; sub: string; icon: React.ReactNode; iconColor: string; iconBg: string }) {
  return (
    <div className="glass glass-highlight glass-float relative flex flex-1 items-center gap-4 overflow-hidden rounded-2xl p-5 transition-all">
      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconBg} ${iconColor}`}>{icon}</div>
      <div className="relative z-10 flex flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="mt-0.5 text-xl font-bold text-foreground md:text-2xl">{value}</span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
    </div>
  )
}

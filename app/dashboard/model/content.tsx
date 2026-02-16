"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/model-dashboard/header"
import { FinanceCards } from "@/components/model-dashboard/finance-cards"
import { PlatformBreakdown } from "@/components/model-dashboard/platform-breakdown"
import { WeeklyChart } from "@/components/model-dashboard/weekly-chart"
import { ModelReferral } from "@/components/model-dashboard/model-referral"
import { LevelProgress } from "@/components/gamification/level-progress"
import { Achievements } from "@/components/gamification/achievements"

export function ModelContent() {
  const [hasEarnings, setHasEarnings] = useState(false)

  useEffect(() => {
    fetch("/api/balance")
      .then((r) => r.json())
      .then((d) => { if (d.totalGross > 0) setHasEarnings(true) })
      .catch(() => {})
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="ambient-orb-1 absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="ambient-orb-2 absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 md:gap-6">
            {!hasEarnings && (
              <div className="glass rounded-xl border border-primary/20 px-4 py-3 text-center text-sm text-primary">
                Для начала работы пройдите верификацию. Нажмите кнопку <strong>Contact Mentor</strong> чтобы связаться с вашим наставником.
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground md:text-2xl">Welcome back</h2>
                <p className="text-sm text-muted-foreground">{"Обзор вашего заработка"}</p>
              </div>
            </div>
            <FinanceCards />
            <LevelProgress role="model" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 md:gap-6">
              <div className="lg:col-span-3"><WeeklyChart /></div>
              <div className="lg:col-span-2"><PlatformBreakdown /></div>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 md:gap-6">
              <ModelReferral />
              <Achievements role="model" />
            </div>
            <p className="text-center text-[11px] text-muted-foreground/50">
              Chaturbate, StripChat, BongaCams — обновляются ежедневно. Flirt4Free, SkyPrivate, XModels — синхронизируются по вторникам.
            </p>
          </div>
        </main>
        <footer className="glass-header relative z-10 px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
          {"Husk'd Label"} &middot; Secure Dashboard &middot; All amounts in USD
        </footer>
      </div>
    </div>
  )
}

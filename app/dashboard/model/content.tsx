"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { DashboardHeader } from "@/components/model-dashboard/header"
import { FinanceCards } from "@/components/model-dashboard/finance-cards"
import { PlatformBreakdown } from "@/components/model-dashboard/platform-breakdown"
import { WeeklyChart } from "@/components/model-dashboard/weekly-chart"
import { ModelReferral } from "@/components/model-dashboard/model-referral"
import { LevelProgress } from "@/components/gamification/level-progress"
import { AchievementsPreview } from "@/components/gamification/achievements-preview"
import { EarningsHeatmap } from "@/components/gamification/earnings-heatmap"
import { GhostChart } from "@/components/gamification/ghost-chart"
import { VibeLog } from "@/components/gamification/vibe-log"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { GraduationCap } from "lucide-react"

function ModelInner() {
  const [hasPlatforms, setHasPlatforms] = useState(true)
  const [isTeacher, setIsTeacher] = useState(false)
  const searchParams = useSearchParams()
  const ghostId = searchParams.get("ghost")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const uid = ghostId || user?.id
      if (uid) {
        supabase.from("profiles").select("platform_nicks, is_teacher").eq("id", uid).single().then(({ data }) => {
            if (data?.is_teacher) setIsTeacher(true)
          if (data?.platform_nicks) {
            try {
              const nicks = typeof data.platform_nicks === "string" ? JSON.parse(data.platform_nicks) : data.platform_nicks
              setHasPlatforms(Object.keys(nicks).length > 0)
            } catch { setHasPlatforms(false) }
          } else { setHasPlatforms(false) }
        })
      }
    })
  }, [ghostId])

  // Pass ghostId as global param for all components
  const gq = ghostId ? `?ghostId=${ghostId}` : ""

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="ambient-orb-1 absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="ambient-orb-2 absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        {ghostId && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-center text-xs text-red-400 font-medium">
            👻 Ghost Mode — вы просматриваете кабинет пользователя
          </div>
        )}
        <DashboardHeader />
        <main className="flex-1 px-4 py-5 md:px-6 md:py-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 md:gap-6">
            {!hasPlatforms && (
              <div className="glass rounded-xl border border-primary/20 px-4 py-3 text-center text-sm text-primary">
                Для начала работы пройдите верификацию. Нажмите кнопку <strong>Contact Mentor</strong> чтобы связаться с вашим наставником.
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-foreground md:text-2xl">Welcome back</h2>
              <p className="text-sm text-muted-foreground">Обзор вашего заработка</p>
            </div>
            {isTeacher && !ghostId && (
              <Link href="/dashboard/teacher-model" className="flex items-center gap-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 p-4 hover:bg-violet-500/15 transition">
                <GraduationCap className="h-5 w-5 text-violet-400" />
                <div><p className="text-sm font-semibold text-violet-400">Мои ученицы</p><p className="text-[11px] text-muted-foreground">Кабинет учителя</p></div>
              </Link>
            )}
            <FinanceCards ghostQuery={gq} />
            <LevelProgress role="model" ghostQuery={gq} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 md:gap-6">
              <div className="lg:col-span-3"><WeeklyChart ghostQuery={gq} /></div>
              <div className="lg:col-span-2"><PlatformBreakdown ghostQuery={gq} /></div>
            </div>
            <GhostChart ghostQuery={gq} />
            <VibeLog />
            <EarningsHeatmap ghostQuery={gq} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 md:gap-6">
              <ModelReferral />
              <AchievementsPreview role="model" ghostQuery={gq} />
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

export function ModelContent() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Загрузка...</p></div>}><ModelInner /></Suspense>
}

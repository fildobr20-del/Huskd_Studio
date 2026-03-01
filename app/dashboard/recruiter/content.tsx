"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { EarningsChart } from "@/components/dashboard/earnings-chart"
import { ReferralTools } from "@/components/dashboard/referral-tools"
import { ModelsTable } from "@/components/dashboard/models-table"
import { LevelProgress } from "@/components/gamification/level-progress"
import { AchievementsPreview } from "@/components/gamification/achievements-preview"
import { EarningsHeatmap } from "@/components/gamification/earnings-heatmap"
import { VibeLog } from "@/components/gamification/vibe-log"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { GraduationCap } from "lucide-react"

function RecruiterInner() {
  const [isTeacher, setIsTeacher] = useState(false)
  const searchParams = useSearchParams()
  const ghostId = searchParams.get("ghost")
  const gq = ghostId ? `?ghostId=${ghostId}` : ""

  useEffect(() => {
    if (ghostId) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from("profiles").select("is_teacher").eq("id", user.id).single().then(({ data }) => { if (data?.is_teacher) setIsTeacher(true) })
    })
  }, [])

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="ambient-orb -left-32 top-16 h-[600px] w-[600px] bg-violet-600/[0.08]" style={{ animation: "orb-float 14s ease-in-out infinite" }} />
        <div className="ambient-orb -right-24 top-1/4 h-[500px] w-[500px] bg-blue-600/[0.07]" style={{ animation: "orb-float-slow 18s ease-in-out infinite" }} />
      </div>
      {ghostId && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-center text-xs text-red-400 font-medium">
          👻 Ghost Mode — вы просматриваете кабинет рекрутера
        </div>
      )}
      <DashboardHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-8 lg:mb-10">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Обзор вашей рекрутерской активности</p>
          {isTeacher && !ghostId && (
            <Link href="/dashboard/teacher-recruiter" className="mt-3 inline-flex items-center gap-2 rounded-full bg-violet-600/10 border border-violet-600/20 px-4 py-2 text-sm font-medium text-violet-400 hover:bg-violet-600/20 transition">
              <GraduationCap className="h-4 w-4" /> Панель учителя
            </Link>
          )}
        </div>
        <section className="mb-8 lg:mb-10"><StatsCards ghostQuery={gq} /></section>
        <section className="mb-8"><LevelProgress role="recruiter" ghostQuery={gq} /></section>
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3"><EarningsChart ghostQuery={gq} /></section>
          <section className="lg:col-span-2"><ReferralTools /></section>
        </div>
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section><ModelsTable ghostQuery={gq} /></section>
          <section><AchievementsPreview role="recruiter" ghostQuery={gq} /></section>
        </div>
        <section className="mb-8"><VibeLog role="recruiter" /></section>
        <section className="mb-8"><EarningsHeatmap ghostQuery={gq} /></section>
        <p className="text-center text-[11px] text-muted-foreground/50 mb-4">
          Chaturbate, StripChat, BongaCams — обновляются ежедневно. Flirt4Free, SkyPrivate, XModels — синхронизируются по вторникам.
        </p>
      </main>
      <footer className="relative py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="liquid-glass-inset rounded-2xl px-6 py-4 text-center text-xs text-muted-foreground">
            {"Husk'd Label"} &middot; All amounts in USD
          </div>
        </div>
      </footer>
    </div>
  )
}

export function RecruiterContent() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Загрузка...</p></div>}><RecruiterInner /></Suspense>
}

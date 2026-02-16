"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { EarningsChart } from "@/components/dashboard/earnings-chart"
import { ReferralTools } from "@/components/dashboard/referral-tools"
import { ModelsTable } from "@/components/dashboard/models-table"

export function RecruiterContent() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="ambient-orb -left-32 top-16 h-[600px] w-[600px] bg-violet-600/[0.08]" style={{ animation: "orb-float 14s ease-in-out infinite" }} />
        <div className="ambient-orb -right-24 top-1/4 h-[500px] w-[500px] bg-blue-600/[0.07]" style={{ animation: "orb-float-slow 18s ease-in-out infinite" }} />
        <div className="ambient-orb bottom-[-100px] left-1/3 h-[450px] w-[450px] bg-emerald-500/[0.05]" style={{ animation: "orb-float 20s ease-in-out infinite reverse" }} />
        <div className="ambient-orb left-2/3 top-1/2 h-[300px] w-[300px] bg-violet-500/[0.04]" style={{ animation: "orb-float-slow 16s ease-in-out infinite" }} />
        <div className="ambient-orb left-1/4 top-2/3 h-[250px] w-[250px] bg-orange-500/[0.03]" style={{ animation: "orb-pulse 8s ease-in-out infinite" }} />
      </div>
      <DashboardHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-8 lg:mb-10">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">{"Here's an overview of your recruitment performance"}</p>
        </div>
        <section aria-label="Key metrics" className="mb-8 lg:mb-10"><StatsCards /></section>
        <div className="mb-8 grid grid-cols-1 gap-6 lg:mb-10 lg:grid-cols-5">
          <section aria-label="Earnings analytics" className="lg:col-span-3"><EarningsChart /></section>
          <section aria-label="Referral tools" className="lg:col-span-2"><ReferralTools /></section>
        </div>
        <section aria-label="Models list" className="mb-8"><ModelsTable /></section>
      </main>
      <footer className="relative py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="liquid-glass-inset rounded-2xl px-6 py-4">
            <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
              <p>{"Husk'd Label Recruiter Portal"}</p>
              <p>{"Need help? Contact support@huskdlabel.com"}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

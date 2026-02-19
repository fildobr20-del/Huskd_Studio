export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  if (request.headers.get("x-admin-secret") !== "huskd-admin-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // All profiles
  const { data: profiles } = await sb.from("profiles").select("id, email, role, total_lifetime_earnings, recruited_by, commission_rate, is_demo, created_at, platform_nicks")

  // All earnings
  const { data: allEarnings } = await sb.from("earnings_daily").select("user_id, date, amount, platform")

  // All payouts
  const { data: allPayouts } = await sb.from("payouts").select("user_id, amount, platform, created_at")

  const real = profiles?.filter(p => !p.is_demo && p.email !== "a@gmail.com") || []
  const models = real.filter(p => p.role === "model")
  const recruiters = real.filter(p => p.role === "recruiter")

  // Studio earnings by week/month
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

  const weekEarnings = allEarnings?.filter(e => e.date >= weekAgo).reduce((s, e) => s + e.amount, 0) || 0
  const monthEarnings = allEarnings?.filter(e => e.date >= monthStart).reduce((s, e) => s + e.amount, 0) || 0
  const totalGross = allEarnings?.reduce((s, e) => s + e.amount, 0) || 0

  // Studio share (20%)
  const studioWeek = Math.round(weekEarnings * 0.2 * 100) / 100
  const studioMonth = Math.round(monthEarnings * 0.2 * 100) / 100
  const studioTotal = Math.round(totalGross * 0.2 * 100) / 100

  // Top models by lifetime
  const topModels = models
    .map(m => ({ email: m.email, earnings: m.total_lifetime_earnings || 0 }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 10)

  // Top recruiters by recruited models' earnings
  const topRecruiters = recruiters.map(r => {
    const rModels = models.filter(m => m.recruited_by === r.id)
    const rEarnings = rModels.reduce((s, m) => s + (m.total_lifetime_earnings || 0), 0)
    const rate = (r.commission_rate || 10) / 100
    return { email: r.email, modelsCount: rModels.length, grossEarnings: rEarnings, commission: Math.round(rEarnings * rate * 100) / 100, rate: r.commission_rate || 10 }
  }).sort((a, b) => b.commission - a.commission)

  // Daily earnings for last 14 days
  const dailyMap: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    dailyMap[d] = 0
  }
  allEarnings?.forEach(e => { if (dailyMap[e.date] !== undefined) dailyMap[e.date] += e.amount })

  // Total payouts
  const totalPaidModels = allPayouts?.filter(p => p.platform !== "commission").reduce((s, p) => s + p.amount, 0) || 0
  const totalPaidRecruiters = allPayouts?.filter(p => p.platform === "commission").reduce((s, p) => s + p.amount, 0) || 0

  return NextResponse.json({
    studioWeek, studioMonth, studioTotal,
    weekGross: Math.round(weekEarnings * 100) / 100,
    monthGross: Math.round(monthEarnings * 100) / 100,
    totalGross: Math.round(totalGross * 100) / 100,
    totalPaidModels: Math.round(totalPaidModels * 100) / 100,
    totalPaidRecruiters: Math.round(totalPaidRecruiters * 100) / 100,
    topModels, topRecruiters,
    dailyEarnings: Object.entries(dailyMap).map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 })),
    totalModels: models.length,
    totalRecruiters: recruiters.length,
  })
}

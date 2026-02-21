export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

interface PlatformEarnings { platform: string; tokens: number; amount: number }

const TOKEN_RATES: Record<string, number> = { stripchat: 0.05, bongacams: 0.021 }
const PLATFORM_NAMES: Record<string, string> = {
  chaturbate: "Chaturbate", stripchat: "StripChat", bongacams: "BongaCams",
  skyprivate: "SkyPrivate", flirt4free: "Flirt4Free", xmodels: "XModels",
}

// StripChat — returns monthly cumulative per model ✅
async function fetchStripchat(modelUsername: string): Promise<PlatformEarnings> {
  try {
    const apiKey = process.env.STRIPCHAT_API_KEY
    if (!apiKey) return { platform: "stripchat", tokens: 0, amount: 0 }
    const studioUsername = process.env.STRIPCHAT_STUDIO_USERNAME || "huskmns"
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const today = now.toISOString().split("T")[0]
    const res = await fetch(
      `https://stripchat.com/api/stats/v2/studios/username/${studioUsername}/models/username/${modelUsername}?startDate=${firstDay}&endDate=${today}`,
      { headers: { "API-Key": apiKey }, cache: "no-store" }
    )
    if (!res.ok) return { platform: "stripchat", tokens: 0, amount: 0 }
    const data = await res.json()
    const rawTokens = data.totalTokens || data.tokens || data.totalEarnings || data.total || 0
    const rawUsd = data.totalUsd || data.usd || data.earnings_usd || 0
    return { platform: "stripchat", tokens: Number(rawTokens), amount: rawUsd > 0 ? Number(rawUsd) : Number(rawTokens) * TOKEN_RATES.stripchat }
  } catch { return { platform: "stripchat", tokens: 0, amount: 0 } }
}

// BongaCams — returns monthly cumulative per model ✅
async function fetchBongaCams(modelUsername: string): Promise<PlatformEarnings> {
  try {
    const apiKey = process.env.BONGACAMS_API_KEY
    if (!apiKey) return { platform: "bongacams", tokens: 0, amount: 0 }
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const today = now.toISOString().split("T")[0]
    const res = await fetch(
      `https://bongacams.com/api/v1/stats/model-regular-earnings?username=${modelUsername}&date_from=${firstDay}&date_to=${today}`,
      { headers: { "ACCESS-KEY": apiKey }, cache: "no-store" }
    )
    if (!res.ok) return { platform: "bongacams", tokens: 0, amount: 0 }
    const data = await res.json()
    const rawTokens = data.with_percentage_rate_tokens || data.tokens || 0
    const rawIncome = data.with_percentage_rate_income || data.income || data.amount || 0
    return { platform: "bongacams", tokens: Number(rawTokens), amount: rawIncome > 0 ? Number(rawIncome) : Number(rawTokens) * TOKEN_RATES.bongacams }
  } catch { return { platform: "bongacams", tokens: 0, amount: 0 } }
}

// NO fetchChaturbate — CB data comes from cron polling into earnings_daily

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const ghostId = url.searchParams.get("ghostId")
    const uid = ghostId || user.id

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: profile } = await sb.from("profiles").select("role, platform_nick, platform_nicks, is_demo").eq("id", uid).single()
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

    if (profile.is_demo) {
      return NextResponse.json({
        totalGross: 6120.50, modelShare: 4284.35, recruiterShare: 612.05, lifetime: 61188.40,
        platformBreakdown: [
          { name: "Chaturbate", amount: 1715, tokens: 49000 },
          { name: "StripChat", amount: 1323.35, tokens: 37810 },
          { name: "BongaCams", amount: 784, tokens: 53333 },
        ],
      })
    }

    let nicks: Record<string, string> = {}
    try { nicks = profile.platform_nicks ? (typeof profile.platform_nicks === "string" ? JSON.parse(profile.platform_nicks) : profile.platform_nicks) : {} } catch {}

    // === 1. LIVE API: only StripChat & BongaCams (per-model APIs) ===
    const liveData: Record<string, PlatformEarnings> = {}
    if (nicks.stripchat) liveData.stripchat = await fetchStripchat(nicks.stripchat)
    if (nicks.bongacams) liveData.bongacams = await fetchBongaCams(nicks.bongacams)

    // === 2. ALL SAVED EARNINGS (includes CB from cron + manual entries) ===
    const { data: allEarnings } = await sb
      .from("earnings_daily")
      .select("amount, platform, date")
      .eq("user_id", uid)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const today = now.toISOString().split("T")[0]

    const savedMonthByPlatform: Record<string, number> = {}
    const savedAllByPlatform: Record<string, number> = {}
    let lifetimeGross = 0

    allEarnings?.forEach(e => {
      const amt = Number(e.amount)
      lifetimeGross += amt
      savedAllByPlatform[e.platform] = (savedAllByPlatform[e.platform] || 0) + amt
      if (e.date >= monthStart) {
        savedMonthByPlatform[e.platform] = (savedMonthByPlatform[e.platform] || 0) + amt
      }
    })

    // === 3. DELTA AUTO-SAVE for StripChat & BongaCams only ===
    if (!ghostId) {
      for (const [platform, live] of Object.entries(liveData)) {
        if (live.amount <= 0) continue
        // These APIs return monthly cumulative — compare with this month's saved total
        const alreadySaved = savedMonthByPlatform[platform] || 0
        const delta = Math.round((live.amount - alreadySaved) * 100) / 100

        if (delta > 0.50) {
          const { data: existing } = await sb
            .from("earnings_daily")
            .select("id, amount")
            .eq("user_id", uid)
            .eq("date", today)
            .eq("platform", platform)
            .single()

          if (existing) {
            const newAmount = Math.round((Number(existing.amount) + delta) * 100) / 100
            await sb.from("earnings_daily").update({ amount: newAmount }).eq("id", existing.id)
          } else {
            await sb.from("earnings_daily").insert({ user_id: uid, date: today, amount: delta, platform })
          }

          lifetimeGross += delta
          savedAllByPlatform[platform] = (savedAllByPlatform[platform] || 0) + delta
          savedMonthByPlatform[platform] = (savedMonthByPlatform[platform] || 0) + delta
        }
      }
    }

    // === 4. PAYOUTS ===
    const { data: payouts } = await sb.from("payouts").select("amount, platform").eq("user_id", uid).eq("status", "completed")
    const paidByPlatform: Record<string, number> = {}
    payouts?.forEach(p => { paidByPlatform[p.platform] = (paidByPlatform[p.platform] || 0) + p.amount })

    // === 5. BREAKDOWN ===
    const allPlatforms = ["chaturbate", "stripchat", "bongacams", "skyprivate", "flirt4free", "xmodels"]
    const breakdown: { name: string; amount: number; tokens: number }[] = []
    let totalBalance = 0

    for (const p of allPlatforms) {
      const saved = savedAllByPlatform[p] || 0
      const paid = paidByPlatform[p] || 0
      const balance = Math.round(Math.max(0, saved - paid) * 100) / 100
      totalBalance += balance

      if (saved > 0 || nicks[p]) {
        breakdown.push({
          name: PLATFORM_NAMES[p] || p,
          amount: Math.round(balance * 0.7 * 100) / 100,
          tokens: liveData[p]?.tokens || 0,
        })
      }
    }

    const modelShare = Math.round(totalBalance * 0.7 * 100) / 100
    const lifetimeModelShare = Math.round(lifetimeGross * 0.7 * 100) / 100

    if (!ghostId && lifetimeGross > 0) {
      await sb.from("profiles").update({ total_lifetime_earnings: Math.round(lifetimeGross * 100) / 100 }).eq("id", uid)
    }

    return NextResponse.json({
      totalGross: Math.round(totalBalance * 100) / 100,
      modelShare,
      recruiterShare: Math.round(totalBalance * 0.1 * 100) / 100,
      lifetime: lifetimeModelShare,
      platformBreakdown: breakdown,
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

interface PlatformEarnings {
  platform: string
  tokens: number
  amount: number
  currency: string
}

const TOKEN_RATES: Record<string, number> = {
  chaturbate: 0.05,
  stripchat: 0.05,
  bongacams: 0.021,
}

const PLATFORM_NAMES: Record<string, string> = {
  chaturbate: "Chaturbate", stripchat: "StripChat", bongacams: "BongaCams",
  skyprivate: "SkyPrivate", flirt4free: "Flirt4Free", xmodels: "XModels",
}

async function fetchChaturbate(username: string): Promise<PlatformEarnings> {
  try {
    const res = await fetch(
      `https://chaturbate.com/affiliates/apistats/?username=${process.env.CHATURBATE_USERNAME}&token=${process.env.CHATURBATE_TOKEN}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return { platform: "chaturbate", tokens: 0, amount: 0, currency: "usd" }
    const data = await res.json()
    const cashout = data.stats?.find((s: any) => s.program === "Cashed-Out Tokens")
    if (!cashout) return { platform: "chaturbate", tokens: 0, amount: 0, currency: "usd" }
    const totalTokens = cashout.totals?.Tokens || 0
    const totalPayout = cashout.totals?.Payout || 0
    const amountUsd = totalPayout > 0 ? Number(totalPayout) : Number(totalTokens) * TOKEN_RATES.chaturbate
    return { platform: "chaturbate", tokens: totalTokens, amount: amountUsd, currency: "usd" }
  } catch { return { platform: "chaturbate", tokens: 0, amount: 0, currency: "usd" } }
}

async function fetchStripchat(modelUsername: string): Promise<PlatformEarnings> {
  try {
    const studioUsername = process.env.STRIPCHAT_STUDIO_USERNAME || "huskmns"
    const apiKey = process.env.STRIPCHAT_API_KEY
    if (!apiKey) return { platform: "stripchat", tokens: 0, amount: 0, currency: "usd" }
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const today = now.toISOString().split("T")[0]
    const res = await fetch(
      `https://stripchat.com/api/stats/v2/studios/username/${studioUsername}/models/username/${modelUsername}?startDate=${firstDay}&endDate=${today}`,
      { headers: { "API-Key": apiKey }, next: { revalidate: 300 } }
    )
    if (!res.ok) return { platform: "stripchat", tokens: 0, amount: 0, currency: "usd" }
    const data = await res.json()
    const rawTokens = data.totalTokens || data.tokens || data.totalEarnings || data.total || data.amount || 0
    const rawUsd = data.totalUsd || data.usd || data.earnings_usd || 0
    const amountUsd = rawUsd > 0 ? Number(rawUsd) : Number(rawTokens) * TOKEN_RATES.stripchat
    return { platform: "stripchat", tokens: Number(rawTokens), amount: amountUsd, currency: "usd" }
  } catch { return { platform: "stripchat", tokens: 0, amount: 0, currency: "usd" } }
}

async function fetchBongaCams(modelUsername: string): Promise<PlatformEarnings> {
  try {
    const apiKey = process.env.BONGACAMS_API_KEY
    if (!apiKey) return { platform: "bongacams", tokens: 0, amount: 0, currency: "usd" }
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const today = now.toISOString().split("T")[0]
    const res = await fetch(
      `https://bongacams.com/api/v1/stats/model-regular-earnings?username=${modelUsername}&date_from=${firstDay}&date_to=${today}`,
      { headers: { "ACCESS-KEY": apiKey }, next: { revalidate: 300 } }
    )
    if (!res.ok) return { platform: "bongacams", tokens: 0, amount: 0, currency: "usd" }
    const data = await res.json()
    const rawTokens = data.with_percentage_rate_tokens || data.tokens || 0
    const rawIncome = data.with_percentage_rate_income || data.income || data.amount || 0
    const amountUsd = rawIncome > 0 ? Number(rawIncome) : Number(rawTokens) * TOKEN_RATES.bongacams
    return { platform: "bongacams", tokens: Number(rawTokens), amount: amountUsd, currency: "usd" }
  } catch { return { platform: "bongacams", tokens: 0, amount: 0, currency: "usd" } }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const ghostId = url.searchParams.get("ghostId")
    const targetUserId = ghostId || user.id

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, platform_nick, platform_nicks, is_demo")
      .eq("id", targetUserId)
      .single()

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

    // Demo account
    if (profile.is_demo) {
      return NextResponse.json({
        totalGross: 6120.50, modelShare: 4284.35, recruiterShare: 612.05,
        lifetime: 61188.40,
        platformBreakdown: [
          { name: "Chaturbate", amount: 1715.00, tokens: 49000 },
          { name: "StripChat", amount: 1323.35, tokens: 37810 },
          { name: "BongaCams", amount: 784.00, tokens: 53333 },
          { name: "SkyPrivate", amount: 294.00, tokens: 0 },
          { name: "Flirt4Free", amount: 168.00, tokens: 0 },
        ],
      })
    }

    let nicks: Record<string, string> = {}
    try { nicks = profile.platform_nicks ? (typeof profile.platform_nicks === "string" ? JSON.parse(profile.platform_nicks) : profile.platform_nicks) : {} } catch { nicks = {} }

    // === 1. LIVE API data (only for platforms with APIs) ===
    const liveData: Record<string, PlatformEarnings> = {}
    if (nicks.chaturbate) { const r = await fetchChaturbate(nicks.chaturbate); liveData.chaturbate = r }
    if (nicks.stripchat) { const r = await fetchStripchat(nicks.stripchat); liveData.stripchat = r }
    if (nicks.bongacams) { const r = await fetchBongaCams(nicks.bongacams); liveData.bongacams = r }

    // === 2. SAVED data from earnings_daily (ALL platforms including manual) ===
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const { data: savedEarnings } = await supabaseAdmin
      .from("earnings_daily")
      .select("amount, platform, date")
      .eq("user_id", targetUserId)
      .gte("date", firstDay)

    const savedByPlatform: Record<string, { amount: number; tokens: number }> = {}
    savedEarnings?.forEach(e => {
      if (!savedByPlatform[e.platform]) savedByPlatform[e.platform] = { amount: 0, tokens: 0 }
      savedByPlatform[e.platform].amount += e.amount
    })

    // === 3. MERGE: for API platforms take MAX(live, saved); for manual platforms use saved ===
    const allPlatforms = ["chaturbate", "stripchat", "bongacams", "skyprivate", "flirt4free", "xmodels"]
    const merged: Record<string, { amount: number; tokens: number }> = {}

    for (const p of allPlatforms) {
      const live = liveData[p]?.amount || 0
      const liveTokens = liveData[p]?.tokens || 0
      const saved = savedByPlatform[p]?.amount || 0
      merged[p] = {
        amount: Math.max(live, saved),
        tokens: liveTokens || savedByPlatform[p]?.tokens || 0,
      }
    }

    // === 4. Auto-save live data to earnings_daily (only positive, don't overwrite with 0) ===
    if (!ghostId) {
      const today = now.toISOString().split("T")[0]
      for (const [p, data] of Object.entries(liveData)) {
        if (data.amount > 0) {
          await supabaseAdmin.from("earnings_daily").upsert(
            { user_id: targetUserId, date: today, amount: data.amount, platform: p },
            { onConflict: "user_id,date,platform" }
          )
        }
      }
    }

    // === 5. PAYOUTS — subtract from balance ===
    const { data: payouts } = await supabaseAdmin
      .from("payouts")
      .select("amount, platform")
      .eq("user_id", targetUserId)
      .eq("status", "completed")

    const paidByPlatform: Record<string, number> = {}
    payouts?.forEach(p => { paidByPlatform[p.platform] = (paidByPlatform[p.platform] || 0) + p.amount })

    // === 6. Calculate final amounts ===
    const breakdown: { name: string; amount: number; tokens: number }[] = []
    let totalGross = 0

    for (const p of allPlatforms) {
      const gross = merged[p]?.amount || 0
      const paid = paidByPlatform[p] || 0
      const balance = Math.max(0, gross - paid)
      totalGross += balance
      if (gross > 0 || nicks[p]) {
        breakdown.push({
          name: PLATFORM_NAMES[p] || p,
          amount: Math.round(balance * 0.7 * 100) / 100,
          tokens: merged[p]?.tokens || 0,
        })
      }
    }

    const modelShare = Math.round(totalGross * 0.7 * 100) / 100
    const recruiterShare = Math.round(totalGross * 0.1 * 100) / 100

    // === 7. LIFETIME from ALL earnings_daily ===
    const { data: allEarnings } = await supabaseAdmin
      .from("earnings_daily")
      .select("amount")
      .eq("user_id", targetUserId)
    const lifetimeGross = allEarnings?.reduce((s, e) => s + e.amount, 0) || 0
    const lifetimeModelShare = Math.round(lifetimeGross * 0.7 * 100) / 100

    // Update profile lifetime
    if (!ghostId && lifetimeGross > 0) {
      await supabaseAdmin.from("profiles").update({ total_lifetime_earnings: lifetimeGross }).eq("id", targetUserId)
    }

    // Add default platforms to breakdown if they have nicks but no data
    for (const p of ["chaturbate", "stripchat", "bongacams"]) {
      if (nicks[p] && !breakdown.find(b => b.name === PLATFORM_NAMES[p])) {
        breakdown.push({ name: PLATFORM_NAMES[p], amount: 0, tokens: 0 })
      }
    }

    return NextResponse.json({
      totalGross: Math.round(totalGross * 100) / 100,
      modelShare,
      recruiterShare,
      lifetime: lifetimeModelShare,
      platformBreakdown: breakdown,
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

interface PlatformEarnings {
  platform: string
  tokens: number
  amount: number
  currency: string
}

// Token-to-USD rates
const TOKEN_RATES: Record<string, number> = {
  chaturbate: 0.05,   // 1 token = $0.05
  stripchat: 0.05,    // 1 token = $0.05
  bongacams: 0.021,   // 1000 tokens = $21
}

async function fetchChaturbate(username: string): Promise<PlatformEarnings> {
  try {
    const res = await fetch(
      `https://chaturbate.com/affiliates/apistats/?username=${process.env.CHATURBATE_USERNAME}&token=${process.env.CHATURBATE_TOKEN}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return { platform: "Chaturbate", tokens: 0, amount: 0, currency: "usd" }
    const data = await res.json()
    const cashout = data.stats?.find((s: any) => s.program === "Cashed-Out Tokens")
    if (!cashout) return { platform: "Chaturbate", tokens: 0, amount: 0, currency: "usd" }
    const totalTokens = cashout.totals?.Tokens || 0
    const totalPayout = cashout.totals?.Payout || 0
    const amountUsd = totalPayout > 0 ? Number(totalPayout) : Number(totalTokens) * TOKEN_RATES.chaturbate
    return { platform: "Chaturbate", tokens: totalTokens, amount: amountUsd, currency: "usd" }
  } catch {
    return { platform: "Chaturbate", tokens: 0, amount: 0, currency: "usd" }
  }
}

async function fetchStripchat(modelUsername: string): Promise<PlatformEarnings> {
  try {
    const studioUsername = process.env.STRIPCHAT_STUDIO_USERNAME || "huskmns"
    const apiKey = process.env.STRIPCHAT_API_KEY
    if (!apiKey) return { platform: "StripChat", tokens: 0, amount: 0, currency: "usd" }
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const today = now.toISOString().split("T")[0]
    const res = await fetch(
      `https://stripchat.com/api/stats/v2/studios/username/${studioUsername}/models/username/${modelUsername}?startDate=${firstDay}&endDate=${today}`,
      { headers: { "API-Key": apiKey }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return { platform: "StripChat", tokens: 0, amount: 0, currency: "usd" }
    const data = await res.json()
    const rawTokens = data.totalTokens || data.tokens || data.totalEarnings || data.total || data.amount || 0
    const rawUsd = data.totalUsd || data.usd || data.earnings_usd || 0
    const amountUsd = rawUsd > 0 ? Number(rawUsd) : Number(rawTokens) * TOKEN_RATES.stripchat
    return { platform: "StripChat", tokens: Number(rawTokens), amount: amountUsd, currency: "usd" }
  } catch {
    return { platform: "StripChat", tokens: 0, amount: 0, currency: "usd" }
  }
}

async function fetchBongaCams(modelUsername: string): Promise<PlatformEarnings> {
  try {
    const apiKey = process.env.BONGACAMS_API_KEY
    if (!apiKey) return { platform: "BongaCams", tokens: 0, amount: 0, currency: "usd" }
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const today = now.toISOString().split("T")[0]
    const res = await fetch(
      `https://bongacams.com/api/v1/stats/model-regular-earnings?username=${modelUsername}&date_from=${firstDay}&date_to=${today}`,
      { headers: { "ACCESS-KEY": apiKey }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return { platform: "BongaCams", tokens: 0, amount: 0, currency: "usd" }
    const data = await res.json()
    const rawTokens = data.with_percentage_rate_tokens || data.tokens || 0
    const rawIncome = data.with_percentage_rate_income || data.income || data.amount || 0
    const amountUsd = rawIncome > 0 ? Number(rawIncome) : Number(rawTokens) * TOKEN_RATES.bongacams
    return { platform: "BongaCams", tokens: Number(rawTokens), amount: amountUsd, currency: "usd" }
  } catch {
    return { platform: "BongaCams", tokens: 0, amount: 0, currency: "usd" }
  }
}

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

    // === LIVE BALANCE from platform APIs ===
    const results: PlatformEarnings[] = []
    if (nicks.chaturbate) results.push(await fetchChaturbate(nicks.chaturbate))
    if (nicks.stripchat) results.push(await fetchStripchat(nicks.stripchat))
    if (nicks.bongacams) results.push(await fetchBongaCams(nicks.bongacams))

    let liveGross = results.reduce((sum, r) => sum + r.amount, 0)

    // Save to earnings_daily (only positive, don't overwrite with 0)
    if (liveGross > 0 && !ghostId) {
      const today = new Date().toISOString().split("T")[0]
      for (const r of results) {
        if (r.amount > 0) {
          const platKey = r.platform.toLowerCase().replace(/\s/g, "")
          await supabaseAdmin.from("earnings_daily").upsert(
            { user_id: targetUserId, date: today, amount: r.amount, platform: platKey },
            { onConflict: "user_id,date,platform" }
          )
        }
      }
    }

    // === FALLBACK: if live API returned 0, use this month's earnings_daily ===
    if (liveGross === 0) {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
      const { data: saved } = await supabaseAdmin
        .from("earnings_daily")
        .select("amount, platform")
        .eq("user_id", targetUserId)
        .gte("date", firstDay)
      
      if (saved && saved.length > 0) {
        const platMap: Record<string, number> = {}
        saved.forEach(e => { platMap[e.platform] = (platMap[e.platform] || 0) + e.amount })
        const names: Record<string, string> = { chaturbate: "Chaturbate", stripchat: "StripChat", bongacams: "BongaCams", skyprivate: "SkyPrivate", flirt4free: "Flirt4Free", xmodels: "XModels" }
        results.length = 0
        for (const [p, amt] of Object.entries(platMap)) {
          results.push({ platform: names[p] || p, tokens: 0, amount: amt, currency: "usd" })
        }
        liveGross = saved.reduce((s, e) => s + e.amount, 0)
      }
    }

    // === LIFETIME from all earnings_daily records ===
    const { data: allEarnings } = await supabaseAdmin
      .from("earnings_daily")
      .select("amount")
      .eq("user_id", targetUserId)
    const lifetime = allEarnings?.reduce((s, e) => s + e.amount, 0) || 0

    // Update profile lifetime
    if (!ghostId && lifetime > 0) {
      await supabaseAdmin.from("profiles").update({ total_lifetime_earnings: lifetime }).eq("id", targetUserId)
    }

    // === Subtract payouts from balance ===
    const { data: payouts } = await supabaseAdmin
      .from("payouts")
      .select("amount, platform")
      .eq("user_id", targetUserId)
      .eq("status", "completed")
    
    const totalPaidOut = payouts?.reduce((s, p) => s + p.amount, 0) || 0
    // Per-platform payout deductions
    const paidByPlatform: Record<string, number> = {}
    payouts?.forEach(p => { paidByPlatform[p.platform] = (paidByPlatform[p.platform] || 0) + p.amount })

    // Balance = live earnings minus payouts for current period
    const adjustedResults = results.map(r => {
      const platKey = r.platform.toLowerCase().replace(/\s/g, "")
      const paid = paidByPlatform[platKey] || 0
      return { ...r, amount: Math.max(0, r.amount - paid) }
    })

    const totalGross = adjustedResults.reduce((sum, r) => sum + r.amount, 0)
    const modelShare = Math.round(totalGross * 0.7 * 100) / 100
    const recruiterShare = Math.round(totalGross * 0.1 * 100) / 100
    const lifetimeModelShare = Math.round(lifetime * 0.7 * 100) / 100

    return NextResponse.json({
      totalGross: Math.round(totalGross * 100) / 100,
      modelShare,
      recruiterShare,
      lifetime: lifetimeModelShare,
      platformBreakdown: adjustedResults.map(r => ({
        name: r.platform,
        amount: Math.round(r.amount * 0.7 * 100) / 100,
        tokens: r.tokens,
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

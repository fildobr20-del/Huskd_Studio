export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

const PLATFORM_NAMES: Record<string, string> = {
  chaturbate: "Chaturbate", stripchat: "StripChat", bongacams: "BongaCams",
  skyprivate: "SkyPrivate", flirt4free: "Flirt4Free", xmodels: "XModels",
}

// NO platform API calls — all data comes from:
// 1. Scraper → /api/scraper → earnings_daily
// 2. CB cron polling → /api/cron/sync-cb → earnings_daily  
// 3. Manual admin input → earnings_daily

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

    // === ALL DATA FROM earnings_daily ONLY ===
    const { data: allEarnings } = await sb
      .from("earnings_daily")
      .select("amount, platform, date")
      .eq("user_id", uid)

    const savedAllByPlatform: Record<string, number> = {}
    let lifetimeGross = 0

    allEarnings?.forEach(e => {
      const amt = Number(e.amount)
      lifetimeGross += amt
      savedAllByPlatform[e.platform] = (savedAllByPlatform[e.platform] || 0) + amt
    })

    // === PAYOUTS ===
    const { data: payouts } = await sb.from("payouts").select("amount, platform").eq("user_id", uid).eq("status", "completed")
    const paidByPlatform: Record<string, number> = {}
    payouts?.forEach(p => { paidByPlatform[p.platform] = (paidByPlatform[p.platform] || 0) + p.amount })

    // === BREAKDOWN ===
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
          tokens: 0,
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

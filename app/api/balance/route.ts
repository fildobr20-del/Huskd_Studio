import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

interface PlatformEarnings {
  platform: string
  tokens: number
  amount: number
  currency: string
}

async function fetchChaturbate(username: string): Promise<PlatformEarnings> {
  try {
    const res = await fetch(
      `https://chaturbate.com/affiliates/apistats/?username=${process.env.CHATURBATE_USERNAME}&token=${process.env.CHATURBATE_TOKEN}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return { platform: "Chaturbate", tokens: 0, amount: 0, currency: "usd" }
    const data = await res.json()

    // Find "Cashed-Out Tokens" program
    const cashout = data.stats?.find((s: any) => s.program === "Cashed-Out Tokens")
    if (!cashout) return { platform: "Chaturbate", tokens: 0, amount: 0, currency: "usd" }

    // Filter rows by model username if needed (this is studio-level data)
    const totalTokens = cashout.totals?.Tokens || 0
    const totalPayout = cashout.totals?.Payout || 0

    return { platform: "Chaturbate", tokens: totalTokens, amount: totalPayout, currency: "usd" }
  } catch {
    return { platform: "Chaturbate", tokens: 0, amount: 0, currency: "usd" }
  }
}

async function fetchStripchat(modelUsername: string): Promise<PlatformEarnings> {
  try {
    const studioUsername = process.env.STRIPCHAT_STUDIO_USERNAME || "huskmns"
    const apiKey = process.env.STRIPCHAT_API_KEY
    if (!apiKey) return { platform: "StripChat", tokens: 0, amount: 0, currency: "usd" }

    // Get current month range
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const today = now.toISOString().split("T")[0]

    const res = await fetch(
      `https://stripchat.com/api/stats/v2/studios/username/${studioUsername}/models/username/${modelUsername}?startDate=${firstDay}&endDate=${today}`,
      {
        headers: { "API-Key": apiKey },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return { platform: "StripChat", tokens: 0, amount: 0, currency: "usd" }
    const data = await res.json()

    // Stripchat returns earnings data - extract total
    const totalAmount = data.totalEarnings || data.total || data.amount || 0

    return { platform: "StripChat", tokens: 0, amount: Number(totalAmount), currency: "usd" }
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
      {
        headers: { "ACCESS-KEY": apiKey },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return { platform: "BongaCams", tokens: 0, amount: 0, currency: "usd" }
    const data = await res.json()

    return {
      platform: "BongaCams",
      tokens: data.with_percentage_rate_tokens || 0,
      amount: data.with_percentage_rate_income || 0,
      currency: data.currency || "usd",
    }
  } catch {
    return { platform: "BongaCams", tokens: 0, amount: 0, currency: "usd" }
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile with platform nicks
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, platform_nick, platform_nicks")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    let nicks: Record<string, string> = {}
    try {
      nicks = profile.platform_nicks ? JSON.parse(profile.platform_nicks) : {}
    } catch {
      nicks = {}
    }

    // If no nicks configured, return zero balances
    if (Object.keys(nicks).length === 0 && !profile.platform_nick) {
      return NextResponse.json({
        totalGross: 0,
        modelShare: 0,
        recruiterShare: 0,
        platformBreakdown: [
          { name: "Chaturbate", amount: 0 },
          { name: "StripChat", amount: 0 },
          { name: "BongaCams", amount: 0 },
        ],
        weeklyEarnings: [],
        message: "Добавьте ники платформ в настройках профиля",
      })
    }

    // Fetch earnings from each platform where nick is set
    const results: PlatformEarnings[] = []

    if (nicks.chaturbate) {
      results.push(await fetchChaturbate(nicks.chaturbate))
    }
    if (nicks.stripchat) {
      results.push(await fetchStripchat(nicks.stripchat))
    }
    if (nicks.bongacams) {
      results.push(await fetchBongaCams(nicks.bongacams))
    }

    const totalGross = results.reduce((sum, r) => sum + r.amount, 0)
    const modelShare = Math.round(totalGross * 0.7 * 100) / 100 // 70% to model
    const recruiterShare = Math.round(totalGross * 0.1 * 100) / 100 // 10% to recruiter

    return NextResponse.json({
      totalGross: Math.round(totalGross * 100) / 100,
      modelShare,
      recruiterShare,
      platformBreakdown: results.map((r) => ({
        name: r.platform,
        amount: Math.round(r.amount * 100) / 100,
        tokens: r.tokens,
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

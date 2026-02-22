export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdmin(request: Request) {
  if (request.headers.get("x-admin-secret") !== "huskd-admin-2026") return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET — get payout history for a user
export async function GET(request: Request) {
  const supabase = getAdmin(request)
  if (!supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")
  if (!userId) return NextResponse.json({ payouts: [] })

  const { data } = await supabase
    .from("payouts")
    .select("id, platform, amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  return NextResponse.json({ payouts: data || [] })
}

// POST — record a payout (reduces current balance, keeps lifetime)
export async function POST(request: Request) {
  const supabase = getAdmin(request)
  if (!supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { userId, platform } = await request.json()
  if (!userId || !platform) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  // Calculate how much is being paid out for this platform (current month earnings)
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  
  const { data: earnings } = await supabase
    .from("earnings_daily")
    .select("amount")
    .eq("user_id", userId)
    .eq("platform", platform)
    .gte("date", firstDay)

  const payoutAmount = earnings?.reduce((s, e) => s + e.amount, 0) || 0

  if (payoutAmount <= 0) {
    return NextResponse.json({ error: "Нет заработка для выплаты", amount: 0 })
  }

  // Record the payout
  await supabase.from("payouts").insert({
    user_id: userId,
    platform,
    amount: payoutAmount,
  })

  // Mark these earnings as "paid" by moving them to a payout date marker
  // We use a special date entry to track paid amount
  const today = now.toISOString().split("T")[0]
  await supabase.from("earnings_daily").insert({
    user_id: userId,
    date: today,
    amount: -payoutAmount,  // Negative = payout deduction from balance
    platform: `${platform}_payout`,
  })

  return NextResponse.json({ success: true, amount: payoutAmount, platform })
}

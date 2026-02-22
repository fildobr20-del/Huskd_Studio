export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdmin(request: Request) {
  if (request.headers.get("x-admin-secret") !== "huskd-admin-2026") return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET — list payouts for a user
export async function GET(request: Request) {
  const supabase = getAdmin(request)
  if (!supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")
  const all = url.searchParams.get("all")

  if (all === "true") {
    // Get all payouts with user info
    const { data } = await supabase
      .from("payouts")
      .select("id, user_id, amount, platform, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
    
    // Get user emails
    const { data: profiles } = await supabase.from("profiles").select("id, email, platform_nick")
    const emailMap: Record<string, string> = {}
    profiles?.forEach(p => { emailMap[p.id] = p.platform_nick || p.email })

    return NextResponse.json({ 
      payouts: (data || []).map(p => ({ ...p, userLabel: emailMap[p.user_id] || "Unknown" }))
    })
  }

  if (!userId) return NextResponse.json({ payouts: [] })

  const { data } = await supabase
    .from("payouts")
    .select("id, amount, platform, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return NextResponse.json({ payouts: data || [] })
}

// POST — record a payout (deducts from displayed balance)
export async function POST(request: Request) {
  const supabase = getAdmin(request)
  if (!supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { userId, platform, amount } = await request.json()
  if (!userId || !platform) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  // Get current balance for this platform from earnings_daily
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const { data: earnings } = await supabase
    .from("earnings_daily")
    .select("amount")
    .eq("user_id", userId)
    .eq("platform", platform)
    .gte("date", firstDay)
  
  const currentBalance = earnings?.reduce((s, e) => s + e.amount, 0) || 0
  const payoutAmount = amount || currentBalance

  if (payoutAmount <= 0) return NextResponse.json({ error: "Nothing to pay out" }, { status: 400 })

  await supabase.from("payouts").insert({
    user_id: userId,
    platform,
    amount: payoutAmount,
    status: "completed",
  })

  return NextResponse.json({ success: true, amount: payoutAmount })
}

// DELETE — remove a payout record
export async function DELETE(request: Request) {
  const supabase = getAdmin(request)
  if (!supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await request.json()
  await supabase.from("payouts").delete().eq("id", id)
  return NextResponse.json({ success: true })
}

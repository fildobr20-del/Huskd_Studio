import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdmin(request: Request) {
  if (request.headers.get("x-admin-secret") !== "huskd-admin-2026") return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: Request) {
  const supabase = getAdmin(request)
  if (!supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")
  if (!userId) return NextResponse.json({ entries: [] })

  const { data } = await supabase
    .from("earnings_daily")
    .select("id, date, amount, platform")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(100)

  return NextResponse.json({ entries: data || [] })
}

export async function POST(request: Request) {
  const supabase = getAdmin(request)
  if (!supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { userId, date, amount, platform } = await request.json()
  if (!userId || !date || !amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  // Upsert — if entry for this user+date+platform exists, update it
  const { data: existing } = await supabase
    .from("earnings_daily")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .eq("platform", platform)
    .single()

  if (existing) {
    await supabase.from("earnings_daily").update({ amount }).eq("id", existing.id)
  } else {
    await supabase.from("earnings_daily").insert({ user_id: userId, date, amount, platform })
  }

  // Update total_lifetime_earnings
  const { data: totals } = await supabase
    .from("earnings_daily")
    .select("amount")
    .eq("user_id", userId)

  const total = totals?.reduce((s, e) => s + e.amount, 0) || 0
  await supabase.from("profiles").update({ total_lifetime_earnings: total }).eq("id", userId)

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = getAdmin(request)
  if (!supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await request.json()
  
  // Get the entry before deleting to know the user_id
  const { data: entry } = await supabase.from("earnings_daily").select("user_id").eq("id", id).single()
  
  await supabase.from("earnings_daily").delete().eq("id", id)

  // Recalculate total_lifetime_earnings for the model
  if (entry?.user_id) {
    const { data: totals } = await supabase.from("earnings_daily").select("amount").eq("user_id", entry.user_id)
    const total = totals?.reduce((s, e) => s + e.amount, 0) || 0
    await supabase.from("profiles").update({ total_lifetime_earnings: total }).eq("id", entry.user_id)
  }

  return NextResponse.json({ success: true })
}

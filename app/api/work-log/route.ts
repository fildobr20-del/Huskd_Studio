export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

// GET - fetch work logs (for model: own logs, for admin: all)
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const url = new URL(request.url)
  const isAdmin = request.headers.get("x-admin-secret") === "huskd-admin-2026"
  const userId = url.searchParams.get("userId")

  if (isAdmin && !userId) {
    // Admin gets all logs for last 30 days
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const { data } = await sb.from("work_logs").select("*").gte("date", since.toISOString().split("T")[0]).order("date", { ascending: false })
    return NextResponse.json({ logs: data || [] })
  }

  const targetId = isAdmin && userId ? userId : user.id
  const { data } = await sb.from("work_logs").select("*").eq("user_id", targetId).order("date", { ascending: false }).limit(30)
  return NextResponse.json({ logs: data || [] })
}

// POST - save today's work platforms
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { platforms } = await request.json()
  const today = new Date().toISOString().split("T")[0]

  await sb.from("work_logs").upsert(
    { user_id: user.id, date: today, platforms: platforms || [] },
    { onConflict: "user_id,date" }
  )

  return NextResponse.json({ success: true })
}

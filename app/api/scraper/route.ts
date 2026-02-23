export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const TOKEN_RATES: Record<string, number> = {
  stripchat: 0.05,
  bongacams: 0.021,
  chaturbate: 0.05,
  skyprivate: 1,
  flirt4free: 0.05,
  xmodels: 1,
}

export async function POST(request: Request) {
  // Auth by secret
  const secret = request.headers.get("x-scraper-secret") || request.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== "huskd-admin-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const body = await request.json()
  const { platform, data } = body

  if (!platform || !data) {
    return NextResponse.json({ error: "Missing platform or data" }, { status: 400 })
  }

  const today = new Date().toISOString().split("T")[0]
  const results: any[] = []

  // Get all models to match usernames
  const { data: allProfiles } = await sb.from("profiles").select("id, email, platform_nicks, platform_nick")

  // Parse earnings array from scraper
  const earnings = data.earnings || data || []
  if (!Array.isArray(earnings)) {
    return NextResponse.json({ error: "data.earnings must be array" }, { status: 400 })
  }

  for (const entry of earnings) {
    const scraperUsername = (entry.username || entry.nick || "").toLowerCase().trim()
    if (!scraperUsername) continue

    // Find model by platform nick
    const profile = allProfiles?.find(p => {
      let nicks: Record<string, string> = {}
      try { nicks = typeof p.platform_nicks === "string" ? JSON.parse(p.platform_nicks) : (p.platform_nicks || {}) } catch {}
      const nick = (nicks[platform] || "").toLowerCase().trim()
      return nick === scraperUsername || (p.platform_nick || "").toLowerCase().trim() === scraperUsername
    })

    if (!profile) {
      results.push({ username: scraperUsername, error: "model not found" })
      continue
    }

    // Calculate USD amount
    const usdAmount = entry.usdTotal || entry.usd || entry.amount || 
      (entry.total ? Math.round(entry.total * (TOKEN_RATES[platform] || 0.05) * 100) / 100 : 0)

    if (usdAmount <= 0) {
      results.push({ username: scraperUsername, note: "zero earnings" })
      continue
    }

    const roundedAmount = Math.round(usdAmount * 100) / 100

    // Get what's already saved this month for this platform
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
    const { data: monthEntries } = await sb
      .from("earnings_daily")
      .select("amount")
      .eq("user_id", profile.id)
      .eq("platform", platform)
      .gte("date", monthStart)

    const alreadySavedThisMonth = Math.round((monthEntries?.reduce((s, e) => s + Number(e.amount), 0) || 0) * 100) / 100

    // Delta = scraper's monthly total - what we already saved
    const delta = Math.round((roundedAmount - alreadySavedThisMonth) * 100) / 100

    if (delta > 0.01) {
      // Upsert today's entry
      const { data: existing } = await sb
        .from("earnings_daily")
        .select("id, amount")
        .eq("user_id", profile.id)
        .eq("date", today)
        .eq("platform", platform)
        .single()

      if (existing) {
        const newAmount = Math.round((Number(existing.amount) + delta) * 100) / 100
        await sb.from("earnings_daily").update({ amount: newAmount }).eq("id", existing.id)
      } else {
        await sb.from("earnings_daily").insert({
          user_id: profile.id, date: today, amount: delta, platform
        })
      }

      // Recalculate lifetime
      const { data: totals } = await sb.from("earnings_daily").select("amount").eq("user_id", profile.id)
      const total = Math.round((totals?.reduce((s, e) => s + Number(e.amount), 0) || 0) * 100) / 100
      await sb.from("profiles").update({ total_lifetime_earnings: total }).eq("id", profile.id)

      results.push({ username: scraperUsername, delta, total: roundedAmount, saved: alreadySavedThisMonth })
    } else {
      results.push({ username: scraperUsername, note: "no new earnings", total: roundedAmount, saved: alreadySavedThisMonth })
    }
  }

  return NextResponse.json({ success: true, platform, processed: results.length, results, timestamp: new Date().toISOString() })
}

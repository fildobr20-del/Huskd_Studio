export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const TOKEN_RATES: Record<string, number> = {
  stripchat: 0.05,
  bongacams: 0.021,
  chaturbate: 0.05,
  skyprivate: 1,
  flirt4free: 0.03,
  xmodels: 1,
  fansly: 1,
  streammodels: 1,
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
  // Текущий месяц в формате 'YYYY-MM' — ключ для snapshot
  const currentMonth = today.slice(0, 7)

  const results: any[] = []

  // Get all models to match usernames
  const { data: allProfiles } = await sb.from("profiles").select("id, email, platform_nicks, platform_nick")

  // Parse earnings array from scraper
  const earnings = data.earnings || data || []
  if (!Array.isArray(earnings)) {
    return NextResponse.json({ error: "data.earnings must be array" }, { status: 400 })
  }

  // Normalize: lowercase + replace spaces/dashes with underscores, strip @
  // "Mable Sparks" → "mable_sparks",  "@Dari_Foxx" → "dari_foxx"
  const normalize = (s: string) => s.replace(/^@+/, "").toLowerCase().trim().replace(/[\s\-]+/g, "_")

  for (const entry of earnings) {
    const scraperUsername = normalize(entry.username || entry.nick || "")
    if (!scraperUsername) continue

    // Find model by platform nick
    const profile = allProfiles?.find(p => {
      let nicks: Record<string, string> = {}
      try { nicks = typeof p.platform_nicks === "string" ? JSON.parse(p.platform_nicks) : (p.platform_nicks || {}) } catch {}
      const nick = normalize(nicks[platform] || "")
      return nick === scraperUsername || normalize(p.platform_nick || "") === scraperUsername
    })

    if (!profile) {
      results.push({ username: scraperUsername, error: "model not found" })
      continue
    }

    // Calculate USD amount from entry
    const usdAmount = entry.usdTotal || entry.usd || entry.amount ||
      (entry.total ? Math.round(entry.total * (TOKEN_RATES[platform] || 0.05) * 100) / 100 : 0)

    if (usdAmount <= 0) {
      results.push({ username: scraperUsername, note: "zero earnings" })
      continue
    }

    const roundedAmount = Math.round(usdAmount * 100) / 100

    // ====================================================================
    // DELTA LOGIC: snapshot-based
    // Используем таблицу platform_snapshots чтобы знать "точку отсчёта".
    // • Первый запуск месяца → сохраняем baseline = текущая сумма, delta = 0
    //   (чтобы не зачислять историю месяца до момента подключения системы)
    // • Последующие запуски → delta = текущая сумма - последнее известное значение
    // ====================================================================
    const { data: snapshot, error: snapshotError } = await sb
      .from("platform_snapshots")
      .select("last_seen_usd")
      .eq("user_id", profile.id)
      .eq("platform", platform)
      .eq("month", currentMonth)
      .single()

    if (snapshotError?.code === "PGRST116" || !snapshot) {
      // Первый запуск этого месяца — устанавливаем baseline, не записываем заработки
      await sb.from("platform_snapshots").insert({
        user_id: profile.id,
        platform,
        month: currentMonth,
        last_seen_usd: roundedAmount,
        updated_at: new Date().toISOString(),
      })
      results.push({
        username: scraperUsername,
        note: "baseline set (first sync this month)",
        baseline: roundedAmount,
      })
      continue
    }

    const lastSeen = Math.round(Number(snapshot.last_seen_usd) * 100) / 100
    const delta = Math.round((roundedAmount - lastSeen) * 100) / 100

    if (delta > 0.01) {
      // Обновляем snapshot
      await sb
        .from("platform_snapshots")
        .update({ last_seen_usd: roundedAmount, updated_at: new Date().toISOString() })
        .eq("user_id", profile.id)
        .eq("platform", platform)
        .eq("month", currentMonth)

      // Upsert в earnings_daily
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
          user_id: profile.id,
          date: today,
          amount: delta,
          platform,
        })
      }

      // Пересчитываем lifetime
      const { data: totals } = await sb.from("earnings_daily").select("amount").eq("user_id", profile.id)
      const total = Math.round((totals?.reduce((s, e) => s + Number(e.amount), 0) || 0) * 100) / 100
      await sb.from("profiles").update({ total_lifetime_earnings: total }).eq("id", profile.id)

      results.push({
        username: scraperUsername,
        delta,
        current: roundedAmount,
        lastSeen,
        saved: delta,
      })
    } else {
      results.push({
        username: scraperUsername,
        note: "no new earnings",
        current: roundedAmount,
        lastSeen,
        delta,
      })
    }
  }

  return NextResponse.json({
    success: true,
    platform,
    processed: results.length,
    results,
    timestamp: new Date().toISOString(),
  })
}

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const TOKEN_RATE = 0.05
const MAX_RETRIES = 3
const RETRY_DELAY = 2000

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<any> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      if (retries > 0 && (res.status >= 500 || res.status === 429)) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return fetchWithRetry(url, options, retries - 1)
      }
      throw new Error(`HTTP ${res.status}`)
    }
    return await res.json()
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw err
  }
}

export async function GET(request: Request) {
  const adminSecret = request.headers.get("x-admin-secret")
  const url = new URL(request.url)
  const cronSecret = url.searchParams.get("secret")
  
  if (adminSecret !== "huskd-admin-2026" && cronSecret !== "huskd-admin-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: models } = await sb
    .from("profiles")
    .select("id, email, cb_stats_url")
    .not("cb_stats_url", "is", null)

  if (!models || models.length === 0) {
    return NextResponse.json({ message: "No models with CB stats URL", synced: 0 })
  }

  const today = new Date().toISOString().split("T")[0]

  const results = await Promise.all(
    models.map(async (model) => {
      try {
        const data = await fetchWithRetry(model.cb_stats_url!, { 
          cache: "no-store",
          headers: { "Accept": "application/json" }
        })

        const currentBalance = Number(data.token_balance || 0)

        const { data: snapshot } = await sb
          .from("cb_snapshots")
          .select("last_balance")
          .eq("user_id", model.id)
          .single()

        const lastBalance = snapshot?.last_balance || 0

        if (currentBalance > lastBalance) {
          const deltaTokens = currentBalance - lastBalance
          const deltaUsd = Math.round(deltaTokens * TOKEN_RATE * 100) / 100

          if (deltaUsd >= 0.01) {
            const { data: existing } = await sb
              .from("earnings_daily")
              .select("id, amount")
              .eq("user_id", model.id)
              .eq("date", today)
              .eq("platform", "chaturbate")
              .single()

            if (existing) {
              const newAmount = Math.round((Number(existing.amount) + deltaUsd) * 100) / 100
              await sb.from("earnings_daily").update({ amount: newAmount }).eq("id", existing.id)
            } else {
              await sb.from("earnings_daily").insert({
                user_id: model.id, date: today, amount: deltaUsd, platform: "chaturbate"
              })
            }
          }
        }

        await sb.from("cb_snapshots").upsert(
          { user_id: model.id, last_balance: currentBalance, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        )

        return { email: model.email, status: "success" }
      } catch (err: any) {
        console.error(`Error after ${MAX_RETRIES} retries for ${model.email}:`, err.message)
        return { email: model.email, error: err.message }
      }
    })
  )

  await Promise.all(
    models.map(async (model) => {
      const { data: totals } = await sb.from("earnings_daily").select("amount").eq("user_id", model.id)
      const total = Math.round((totals?.reduce((s, e) => s + Number(e.amount), 0) || 0) * 100) / 100
      await sb.from("profiles").update({ total_lifetime_earnings: total }).eq("id", model.id)
    })
  )

  return NextResponse.json({ synced: results.length, results, timestamp: new Date().toISOString() })
}

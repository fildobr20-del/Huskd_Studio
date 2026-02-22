export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  if (request.headers.get("x-admin-secret") !== "huskd-admin-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, platform_nicks")

  if (!profiles) return NextResponse.json({ cleaned: 0 })

  // Find duplicates: same nick on same platform across different users
  const nickMap: Record<string, { userId: string; email: string }[]> = {}
  
  for (const p of profiles) {
    let nicks: Record<string, string> = {}
    try { nicks = typeof p.platform_nicks === "string" ? JSON.parse(p.platform_nicks) : (p.platform_nicks || {}) } catch { continue }
    
    for (const [platform, nick] of Object.entries(nicks)) {
      if (!nick) continue
      const key = `${platform}:${nick.toLowerCase()}`
      if (!nickMap[key]) nickMap[key] = []
      nickMap[key].push({ userId: p.id, email: p.email })
    }
  }

  // Clear nicks that appear more than once
  let cleaned = 0
  const duplicates: string[] = []
  
  for (const [key, users] of Object.entries(nickMap)) {
    if (users.length > 1) {
      duplicates.push(`${key} → ${users.map(u => u.email).join(", ")}`)
      // Clear platform_nicks and platform_nick for ALL users with this duplicate
      for (const u of users) {
        await supabaseAdmin.from("profiles").update({ 
          platform_nick: null, 
          platform_nicks: null 
        }).eq("id", u.userId)
        cleaned++
      }
    }
  }

  return NextResponse.json({ cleaned, duplicates })
}

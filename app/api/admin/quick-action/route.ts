export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  if (request.headers.get("x-admin-secret") !== "huskd-admin-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const body = await request.json()
  const { action, userId } = body

  if (action === "link_recruiter") {
    await sb.from("profiles").update({ recruited_by: body.recruiterId || null }).eq("id", userId)
    return NextResponse.json({ success: true })
  }
  if (action === "set_commission") {
    await sb.from("profiles").update({ commission_rate: body.commissionRate }).eq("id", userId)
    return NextResponse.json({ success: true })
  }
  if (action === "set_teacher") {
    await sb.from("profiles").update({ is_teacher: body.isTeacher }).eq("id", userId)
    return NextResponse.json({ success: true })
  }
  if (action === "link_teacher") {
    await sb.from("profiles").update({ teacher_id: body.teacherId || null }).eq("id", userId)
    return NextResponse.json({ success: true })
  }
  if (action === "set_cb_stats_url") {
    await sb.from("profiles").update({ cb_stats_url: body.url || null }).eq("id", userId)
    return NextResponse.json({ success: true })
  }
  if (action === "set_nicks") {
    // Update platform_nicks JSON and platform_nick (primary nick for display)
    const nicks = body.nicks || {}
    const primaryNick = nicks.chaturbate || nicks.stripchat || nicks.bongacams || Object.values(nicks).find(v => v) || ""
    await sb.from("profiles").update({ platform_nicks: nicks, platform_nick: primaryNick }).eq("id", userId)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

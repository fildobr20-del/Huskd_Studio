export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  if (request.headers.get("x-admin-secret") !== "huskd-admin-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { action, userId, recruiterId, commissionRate } = await request.json()

  if (action === "link_recruiter") {
    await sb.from("profiles").update({ recruited_by: recruiterId || null }).eq("id", userId)
    return NextResponse.json({ success: true })
  }

  if (action === "set_commission") {
    await sb.from("profiles").update({ commission_rate: commissionRate }).eq("id", userId)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  if (request.headers.get("x-admin-secret") !== "huskd-admin-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, email, role, platform_nick, platform_nicks, display_name, total_lifetime_earnings, recruited_by, referral_code, commission_rate, teacher_id, is_teacher")
    .order("created_at", { ascending: false })

  // For recruiters, calculate their commission from recruited models
  const profiles = data || []
  const models = profiles.map(m => {
    let nicks: Record<string, string> = {}
    try { nicks = typeof m.platform_nicks === "string" ? JSON.parse(m.platform_nicks) : (m.platform_nicks || {}) } catch {}
    
    let recruiterCommission = 0
    if (m.role === "recruiter") {
      const rate = (m.commission_rate || 10) / 100
      const recruitedModels = profiles.filter(p => p.recruited_by === m.id)
      recruiterCommission = Math.round(recruitedModels.reduce((s, p) => s + (p.total_lifetime_earnings || 0), 0) * rate * 100) / 100
    }

    return {
      id: m.id,
      email: m.email,
      role: m.role,
      platformNick: m.platform_nick || m.display_name || "",
      platformNicks: nicks,
      displayName: m.display_name || "",
      totalEarnings: m.total_lifetime_earnings || 0,
      recruiterCommission,
      recruitedBy: m.recruited_by || null,
      referralCode: m.referral_code || "",
      commissionRate: m.commission_rate || 10,
      teacherId: m.teacher_id || null,
      isTeacher: m.is_teacher || false,
    }
  })

  return NextResponse.json({ models })
}

export async function DELETE(request: Request) {
  if (request.headers.get("x-admin-secret") !== "huskd-admin-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  
  // Delete earnings
  await supabaseAdmin.from("earnings_daily").delete().eq("user_id", userId)
  // Delete vibe logs
  await supabaseAdmin.from("vibe_logs").delete().eq("user_id", userId)
  // Delete profile
  await supabaseAdmin.from("profiles").delete().eq("id", userId)
  // Delete auth user
  await supabaseAdmin.auth.admin.deleteUser(userId)

  return NextResponse.json({ success: true })
}

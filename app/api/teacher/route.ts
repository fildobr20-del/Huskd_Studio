export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Check if user is teacher
  const { data: profile } = await sb.from("profiles").select("role, is_teacher, teacher_notes").eq("id", user.id).single()
  if (!profile?.is_teacher) return NextResponse.json({ error: "Not a teacher" }, { status: 403 })

  if (profile.role === "model") {
    // Teacher Model: get assigned models
    const { data: students } = await sb
      .from("profiles")
      .select("id, email, platform_nick, platform_nicks, display_name, total_lifetime_earnings")
      .eq("teacher_id", user.id)
      .eq("role", "model")

    return NextResponse.json({
      role: "teacher_model",
      notes: profile.teacher_notes || "",
      students: (students || []).map(m => {
        let nicks: Record<string, string> = {}
        try { nicks = typeof m.platform_nicks === "string" ? JSON.parse(m.platform_nicks) : (m.platform_nicks || {}) } catch {}
        return { id: m.id, email: m.email, nick: m.platform_nick || m.display_name || "", nicks, earnings: m.total_lifetime_earnings || 0 }
      })
    })
  }

  if (profile.role === "recruiter") {
    // Teacher Recruiter: get assigned recruiters + their models
    const { data: recruiters } = await sb
      .from("profiles")
      .select("id, email")
      .eq("teacher_id", user.id)
      .eq("role", "recruiter")

    const { data: allModels } = await sb
      .from("profiles")
      .select("id, recruited_by, total_lifetime_earnings")
      .eq("role", "model")

    const models = allModels || []
    let grandTotal = 0, grandModels = 0
    const data = (recruiters || []).map(r => {
      const rm = models.filter(m => m.recruited_by === r.id)
      const gross = rm.reduce((s, m) => s + (m.total_lifetime_earnings || 0), 0)
      const my = Math.round(gross * 0.02 * 100) / 100
      grandTotal += my; grandModels += rm.length
      return { id: r.id, email: r.email, modelsCount: rm.length, gross: Math.round(gross * 100) / 100, my }
    })

    return NextResponse.json({
      role: "teacher_recruiter",
      notes: profile.teacher_notes || "",
      students: data,
      totalModels: grandModels,
      totalCommission: Math.round(grandTotal * 100) / 100
    })
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 })
}

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  if (request.headers.get("x-admin-secret") !== "huskd-admin-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, email, role, platform_nick, platform_nicks, display_name, total_lifetime_earnings, recruited_by, referral_code")
    .order("created_at", { ascending: false })
  return NextResponse.json({
    models: data?.map(m => {
      let nicks: Record<string, string> = {}
      try { nicks = typeof m.platform_nicks === "string" ? JSON.parse(m.platform_nicks) : (m.platform_nicks || {}) } catch {}
      return {
        id: m.id,
        email: m.email,
        role: m.role,
        platformNick: m.platform_nick || m.display_name || "",
        platformNicks: nicks,
        displayName: m.display_name || "",
        totalEarnings: m.total_lifetime_earnings || 0,
        recruitedBy: m.recruited_by || null,
        referralCode: m.referral_code || "",
      }
    }) || []
  })
}

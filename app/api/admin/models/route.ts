import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  if (request.headers.get("x-admin-secret") !== "huskd-admin-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, email, role, platform_nick, display_name, total_lifetime_earnings, recruited_by, referral_code")
    .order("created_at", { ascending: false })
  return NextResponse.json({
    models: data?.map(m => ({
      id: m.id,
      email: m.email,
      role: m.role,
      platformNick: m.platform_nick || m.display_name || "",
      displayName: m.display_name || "",
      totalEarnings: m.total_lifetime_earnings || 0,
      recruitedBy: m.recruited_by || null,
      referralCode: m.referral_code || "",
    })) || []
  })
}

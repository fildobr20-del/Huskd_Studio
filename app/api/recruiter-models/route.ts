import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Use admin client to query all profiles
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find all models recruited by this user
    const { data: models, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, platform_nick, platform_nicks, total_lifetime_earnings, created_at, role")
      .eq("recruited_by", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Calculate totals
    const activeModels = models?.filter(m => m.platform_nick || m.platform_nicks) || []
    const totalModelEarnings = models?.reduce((sum, m) => sum + (m.total_lifetime_earnings || 0), 0) || 0
    const recruiterCommission = Math.round(totalModelEarnings * 0.1 * 100) / 100 // 10%

    return NextResponse.json({
      models: models?.map(m => ({
        id: m.id,
        email: m.email,
        displayName: m.display_name || m.email?.split("@")[0] || "Model",
        platformNick: m.platform_nick || "-",
        earnings: m.total_lifetime_earnings || 0,
        joinedAt: m.created_at,
        hasNicks: !!(m.platform_nick || m.platform_nicks),
      })).sort((a, b) => b.earnings - a.earnings) || [],
      totalModels: models?.length || 0,
      activeModels: activeModels.length,
      totalModelEarnings,
      recruiterCommission,
    })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

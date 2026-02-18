import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

// GET — fetch daily earnings for a user (or for recruiter's models)
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const year = url.searchParams.get("year") || new Date().getFullYear().toString()
    const ghostId = url.searchParams.get("ghostId")

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", ghostId || user.id)
      .single()

    let earnings: any[] = []

    if (profile?.role === "recruiter") {
      // Get all recruited models' earnings
      const { data: models } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("recruited_by", user.id)

      if (models && models.length > 0) {
        const modelIds = models.map(m => m.id)
        const { data } = await supabaseAdmin
          .from("earnings_daily")
          .select("date, amount")
          .in("user_id", modelIds)
          .gte("date", `${year}-01-01`)
          .lte("date", `${year}-12-31`)
          .order("date")

        // Aggregate by date, apply 10% commission
        const byDate: Record<string, number> = {}
        data?.forEach(e => {
          byDate[e.date] = (byDate[e.date] || 0) + (e.amount * 0.1)
        })
        earnings = Object.entries(byDate).map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      }
    } else {
      // Model — get own earnings
      const { data } = await supabaseAdmin
        .from("earnings_daily")
        .select("date, amount")
        .eq("user_id", ghostId || user.id)
        .gte("date", `${year}-01-01`)
        .lte("date", `${year}-12-31`)
        .order("date")

      earnings = data || []
    }

    return NextResponse.json({ earnings })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

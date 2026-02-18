import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get total_lifetime_earnings from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_lifetime_earnings")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      lifetimeEarnings: profile?.total_lifetime_earnings || 0,
    })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

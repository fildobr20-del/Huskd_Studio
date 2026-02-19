import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { platform_nicks } = await request.json()
    const nicks = typeof platform_nicks === "string" ? JSON.parse(platform_nicks) : platform_nicks
    const primaryNick = nicks.chaturbate || nicks.stripchat || nicks.bongacams || nicks.flirt4free || ""

    const { error } = await supabase
      .from("profiles")
      .update({ platform_nick: primaryNick, platform_nicks: JSON.stringify(nicks) })
      .eq("id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, display_name, role, platform_nick, platform_nicks")
      .eq("id", user.id)
      .single()

    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

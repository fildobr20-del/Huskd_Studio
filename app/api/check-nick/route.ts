import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { platform, nick, userId } = await request.json()
    if (!platform || !nick) return NextResponse.json({ available: true })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, platform_nicks")

    const taken = profiles?.some(p => {
      if (p.id === userId) return false
      try {
        const nicks = typeof p.platform_nicks === "string" ? JSON.parse(p.platform_nicks) : (p.platform_nicks || {})
        return nicks[platform]?.toLowerCase() === nick.toLowerCase()
      } catch { return false }
    })

    return NextResponse.json({ available: !taken, takenBy: taken ? "другим пользователем" : null })
  } catch {
    return NextResponse.json({ available: true })
  }
}

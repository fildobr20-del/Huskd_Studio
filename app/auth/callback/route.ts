import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://huskdlabl.site"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        return NextResponse.redirect(`${siteUrl}/dashboard/${profile?.role === "recruiter" ? "recruiter" : "model"}`)
      }
    }
  }
  return NextResponse.redirect(`${siteUrl}/login?error=auth`)
}

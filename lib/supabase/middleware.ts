import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://huskdlabl.site"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Not logged in → redirect to login
  if (!user && (path.startsWith("/dashboard") || path === "/onboarding")) {
    return NextResponse.redirect(`${siteUrl}/login`)
  }

  // Logged in → redirect from login/register to dashboard
  if (user && (path === "/login" || path === "/register")) {
    const { data: profile } = await supabase.from("profiles").select("role, platform_nick").eq("id", user.id).single()
    if (profile?.role === "model" && !profile?.platform_nick) {
      return NextResponse.redirect(`${siteUrl}/onboarding`)
    }
    return NextResponse.redirect(`${siteUrl}/dashboard/${profile?.role === "recruiter" ? "recruiter" : "model"}`)
  }

  // Logged in on /dashboard root → redirect to correct dashboard
  if (user && path === "/dashboard") {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    return NextResponse.redirect(`${siteUrl}/dashboard/${profile?.role === "recruiter" ? "recruiter" : "model"}`)
  }

  return response
}

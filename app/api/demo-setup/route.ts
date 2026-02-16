import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// POST /api/demo-setup — creates a demo model account with pre-filled data
export async function POST(request: Request) {
  try {
    const { secret } = await request.json()
    if (secret !== "huskd-demo-2026") {
      return NextResponse.json({ error: "Invalid" }, { status: 403 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const email = "demo@huskdlabl.site"
    const password = "DemoHusk2026!"

    // Try creating user (may already exist)
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single()

    let userId: string

    if (existing) {
      userId = existing.id
    } else {
      const { data: userData, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "model" },
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      userId = userData.user!.id
      await new Promise((r) => setTimeout(r, 1000))
    }

    // Set up demo profile with high numbers
    await supabaseAdmin.from("profiles").update({
      role: "model",
      display_name: "Demo Model",
      platform_nick: "DemoQueen",
      platform_nicks: JSON.stringify({
        chaturbate: "DemoQueen",
        stripchat: "DemoQueen",
        bongacams: "DemoQueen",
      }),
      total_lifetime_earnings: 87412,
      referral_code: "HL-DEMO01",
      is_demo: true,
    }).eq("id", userId)

    return NextResponse.json({
      success: true,
      email,
      password,
      message: "Demo account ready",
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

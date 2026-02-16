import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function generatePassword(length = 10): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function generateRefCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = "HL-"
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: Request) {
  try {
    const { email, role, refCode } = await request.json()

    if (!email || !role || !["model", "recruiter"].includes(role)) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const password = generatePassword()
    const referralCode = generateRefCode()

    // Create user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role },
    })

    if (createError) {
      if (createError.message.includes("already been registered")) {
        return NextResponse.json({ error: "Этот email уже зарегистрирован. Используйте вход." }, { status: 409 })
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!userData.user) {
      return NextResponse.json({ error: "Не удалось создать пользователя" }, { status: 500 })
    }

    // Wait a moment for Supabase trigger to create profile
    await new Promise((r) => setTimeout(r, 1000))

    // Set referral_code on the new profile
    await supabaseAdmin
      .from("profiles")
      .update({ referral_code: referralCode })
      .eq("id", userData.user.id)

    // Link to recruiter if refCode provided
    if (refCode && refCode.trim()) {
      // Try matching by referral_code first
      let recruiterId: string | null = null

      const { data: byCode } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("referral_code", refCode.trim())
        .single()

      if (byCode) {
        recruiterId = byCode.id
      } else {
        // Try matching by id prefix (fallback for old codes)
        const { data: allProfiles } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("role", "recruiter")

        if (allProfiles) {
          const match = allProfiles.find((p) => p.id.startsWith(refCode.trim()))
          if (match) recruiterId = match.id
        }
      }

      if (recruiterId) {
        await supabaseAdmin
          .from("profiles")
          .update({ recruited_by: recruiterId })
          .eq("id", userData.user.id)
      }
    }

    return NextResponse.json({
      success: true,
      password,
      message: "Аккаунт создан! Сохраните пароль.",
    })
  } catch (error) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

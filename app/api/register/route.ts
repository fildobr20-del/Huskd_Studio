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

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json()

    if (!email || !role || !["model", "recruiter"].includes(role)) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 })
    }

    // Use service role key to create users (admin operation)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const password = generatePassword()

    // Create user with password
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm email
      user_metadata: { role },
    })

    if (createError) {
      if (createError.message.includes("already been registered")) {
        return NextResponse.json({ error: "Этот email уже зарегистрирован. Используйте вход." }, { status: 409 })
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Send password via Supabase email (using built-in SMTP)
    // We'll use the invite method to trigger an email, but since we auto-confirmed,
    // we send a custom approach: use the resetPasswordForEmail to send a "welcome" style email
    // Actually, simplest: just show password on screen + send via API

    return NextResponse.json({
      success: true,
      password,
      message: "Аккаунт создан! Сохраните пароль.",
    })
  } catch (error) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

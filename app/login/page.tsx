"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Mail, Lock, ArrowLeft, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError("Неверный email или пароль")
      setLoading(false)
      return
    }

    // Get user role and redirect
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, platform_nick")
        .eq("id", user.id)
        .single()

      if (profile?.role === "model" && !profile?.platform_nick) {
        router.push("/onboarding")
      } else if (profile?.role === "recruiter") {
        router.push("/dashboard/recruiter")
      } else {
        router.push("/dashboard/model")
      }
    }

    setLoading(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsla(275, 60%, 35%, 0.5) 0%, transparent 70%)" }} />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> На главную
        </Link>

        <div className="glass-gold rounded-2xl p-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient">
              <span className="text-xs font-bold text-background">H</span>
            </div>
            <span className="font-serif text-xl font-bold">{"Husk'd Labl"}</span>
          </div>

          <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">Вход</h1>
          <p className="mb-6 text-sm text-muted-foreground">Введите email и пароль</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-border bg-background/50 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-muted-foreground">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ваш пароль" className="w-full rounded-xl border border-border bg-background/50 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-full bg-gold-gradient py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Вход...</> : "Войти"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-primary hover:underline">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

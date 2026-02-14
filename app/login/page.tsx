"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    setSent(true)
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
          {!sent ? (
            <>
              <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">Вход</h1>
              <p className="mb-6 text-sm text-muted-foreground">Отправим magic-ссылку на ваш email</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-muted-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-border bg-background/50 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-full bg-gold-gradient py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Отправка...</> : "Отправить ссылку"}
                </button>
              </form>
              <p className="mt-6 text-center text-xs text-muted-foreground">Нет аккаунта? Ссылка создаст его автоматически.</p>
            </>
          ) : (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="mb-2 font-serif text-xl font-bold">Проверьте почту</h2>
              <p className="mb-2 text-sm text-muted-foreground">Мы отправили ссылку на</p>
              <p className="mb-4 font-semibold text-foreground">{email}</p>
              <p className="text-xs text-muted-foreground">Нажмите ссылку в письме. Проверьте «Спам».</p>
              <button onClick={() => { setSent(false); setEmail("") }} className="mt-6 text-sm text-primary transition hover:opacity-80">Другой email</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

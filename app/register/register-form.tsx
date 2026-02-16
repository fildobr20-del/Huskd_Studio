"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Mail, ArrowLeft, Loader2, CheckCircle2, Copy, Check, User, Users } from "lucide-react"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"model" | "recruiter" | "">("")
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [refCode, setRefCode] = useState("")
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) setRefCode(ref)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) { setError("Выберите роль"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, refCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Ошибка регистрации")
        setLoading(false)
        return
      }
      setPassword(data.password)
    } catch {
      setError("Ошибка сервера")
    }
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (password) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsla(275, 60%, 35%, 0.5) 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10 w-full max-w-md glass-gold rounded-2xl p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
          <h2 className="mb-2 font-serif text-2xl font-bold">Аккаунт создан!</h2>
          <p className="mb-6 text-sm text-muted-foreground">Сохраните ваш пароль — он показывается только один раз</p>
          <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3">
            <code className="text-lg font-bold text-foreground">{password}</code>
            <button onClick={handleCopy} className="rounded-lg p-2 text-muted-foreground hover:text-foreground transition">
              {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <Link href="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-3 text-sm font-semibold text-background transition hover:opacity-90">
            Войти в аккаунт
          </Link>
        </div>
      </div>
    )
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
          <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">Регистрация</h1>
          <p className="mb-6 text-sm text-muted-foreground">Создайте аккаунт чтобы начать</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" /> Email
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Выберите роль</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRole("model")} className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition ${role === "model" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  <User className="h-4 w-4" /> Модель
                </button>
                <button type="button" onClick={() => setRole("recruiter")} className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition ${role === "recruiter" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  <Users className="h-4 w-4" /> Рекрутер
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Укажите код друга (если есть)</label>
              <input type="text" value={refCode} onChange={(e) => setRefCode(e.target.value)} placeholder="HL-XXXXXX" className="w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={loading || !email || !role} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gold-gradient py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Создание...</> : "Создать аккаунт"}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Уже есть аккаунт? <Link href="/login" className="text-primary hover:underline">Войти</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

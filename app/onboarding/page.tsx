"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

const platforms = [
  { id: "chaturbate", name: "Chaturbate", color: "#f68b24" },
  { id: "stripchat", name: "StripChat", color: "#e74c3c" },
  { id: "bongacams", name: "BongaCams", color: "#9b59b6" },
  { id: "skyprivate", name: "SkyPrivate", color: "#3498db" },
  { id: "flirt4free", name: "Flirt4Free", color: "#e91e8c" },
]

export default function OnboardingPage() {
  const [nicks, setNicks] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [userId, setUserId] = useState("")
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      setUserId(user.id)
      // Load existing nicks
      supabase.from("profiles").select("platform_nicks").eq("id", user.id).single().then(({ data }) => {
        if (data?.platform_nicks) {
          try {
            const existing = typeof data.platform_nicks === "string" ? JSON.parse(data.platform_nicks) : data.platform_nicks
            setNicks(existing)
          } catch {}
        }
      })
    })
  }, [router])

  const checkNick = async (platform: string, nick: string) => {
    if (!nick.trim()) { setErrors(e => ({ ...e, [platform]: "" })); return }
    const res = await fetch("/api/check-nick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, nick: nick.trim(), userId }),
    })
    const data = await res.json()
    if (!data.available) {
      setErrors(e => ({ ...e, [platform]: "Этот ник уже занят другим пользователем" }))
    } else {
      setErrors(e => ({ ...e, [platform]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const filledNicks = Object.entries(nicks).filter(([_, v]) => v.trim())
    if (filledNicks.length === 0) { setError("Введите ник хотя бы на одной платформе"); return }
    if (Object.values(errors).some(e => e)) { setError("Исправьте ошибки"); return }

    setLoading(true)
    setError("")
    const supabase = createClient()
    const platformNicks = JSON.stringify(Object.fromEntries(filledNicks))

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ platform_nick: filledNicks[0][1], platform_nicks: platformNicks })
      .eq("id", userId)

    if (updateError) { setError("Ошибка сохранения: " + updateError.message); setLoading(false); return }
    router.push("/dashboard/model")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsla(275, 60%, 35%, 0.5) 0%, transparent 70%)" }} />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-gold rounded-2xl p-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient">
              <span className="text-xs font-bold text-background">H</span>
            </div>
            <span className="font-serif text-xl font-bold">{"Husk'd Labl"}</span>
          </div>
          <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">Настройка профиля</h1>
          <p className="mb-6 text-sm text-muted-foreground">Введите ваши ники на платформах — так мы привяжем статистику. Один ник = один пользователь.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {platforms.map((p) => (
              <div key={p.id}>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  {p.name}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nicks[p.id] || ""}
                    onChange={(e) => setNicks({ ...nicks, [p.id]: e.target.value })}
                    onBlur={(e) => checkNick(p.id, e.target.value)}
                    placeholder={`Ваш ник на ${p.name}`}
                    className={`flex-1 rounded-xl border bg-background/50 py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 ${errors[p.id] ? "border-red-500/50 focus:ring-red-500/30" : "border-border focus:border-primary/40 focus:ring-primary/30"}`}
                  />
                  {nicks[p.id] && (
                    <button type="button" onClick={() => { const n = { ...nicks }; delete n[p.id]; setNicks(n); setErrors(e => ({ ...e, [p.id]: "" })) }} className="rounded-xl border border-red-500/20 px-3 text-red-400/60 hover:text-red-400 hover:border-red-500/40 transition text-xs">✕</button>
                  )}
                </div>
                {errors[p.id] && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3" /> {errors[p.id]}
                  </p>
                )}
              </div>
            ))}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={loading} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gold-gradient py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Сохранение...</> : <><CheckCircle2 className="h-4 w-4" /> Сохранить и перейти в кабинет</>}
            </button>
            <button type="button" onClick={() => router.push("/dashboard/model")} className="flex items-center justify-center rounded-full border border-border py-2.5 text-sm text-muted-foreground transition hover:text-foreground hover:border-foreground/20">
              Добавлю позже
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

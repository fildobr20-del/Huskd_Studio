"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, CreditCard, Wallet, Building } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function SettingsPage() {
  const [sbp, setSbp] = useState("")
  const [card, setCard] = useState("")
  const [cryptoBep20, setCryptoBep20] = useState("")
  const [cryptoEth, setCryptoEth] = useState("")
  const [cryptoSol, setCryptoSol] = useState("")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [role, setRole] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("role, sbp_number, card_number, crypto_wallet").eq("id", user.id).single().then(({ data }) => {
          if (data) {
            setRole(data.role || "")
            setSbp(data.sbp_number || "")
            setCard(data.card_number || "")
            // Parse crypto_wallet JSON or legacy string
            try {
              const cw = JSON.parse(data.crypto_wallet || "{}")
              setCryptoBep20(cw.bep20 || "")
              setCryptoEth(cw.eth || "")
              setCryptoSol(cw.sol || "")
            } catch {
              setCryptoBep20(data.crypto_wallet || "")
            }
          }
        })
      }
    })
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const cryptoWallet = JSON.stringify({
        bep20: cryptoBep20,
        eth: cryptoEth,
        sol: cryptoSol,
      })
      await supabase.from("profiles").update({
        sbp_number: sbp, card_number: card, crypto_wallet: cryptoWallet,
      }).eq("id", user.id)
    }
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const dashboardUrl = role === "recruiter" ? "/dashboard/recruiter" : "/dashboard/model"

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsla(275, 60%, 35%, 0.5) 0%, transparent 70%)" }} />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <Link href={dashboardUrl} className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>
        <div className="glass-gold rounded-2xl p-8">
          <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">Платёжные данные</h1>
          <p className="mb-6 text-sm text-muted-foreground">Укажите реквизиты для получения выплат</p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building className="h-4 w-4" /> Номер СБП
              </label>
              <input type="text" value={sbp} onChange={(e) => setSbp(e.target.value)} placeholder="+7 999 123 45 67" className="w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CreditCard className="h-4 w-4" /> Номер карты
              </label>
              <input type="text" value={card} onChange={(e) => setCard(e.target.value)} placeholder="0000 0000 0000 0000" className="w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>

            <div className="border-t border-border/50 pt-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"><Wallet className="h-4 w-4" /> Криптокошельки (USDT)</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground/70">BEP-20 (BSC)</label>
                  <input type="text" value={cryptoBep20} onChange={(e) => setCryptoBep20(e.target.value)} placeholder="0x..." className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground/70">ERC-20 (Ethereum)</label>
                  <input type="text" value={cryptoEth} onChange={(e) => setCryptoEth(e.target.value)} placeholder="0x..." className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground/70">SOL (Solana)</label>
                  <input type="text" value={cryptoSol} onChange={(e) => setCryptoSol(e.target.value)} placeholder="So..." className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                </div>
              </div>
            </div>

            <button onClick={handleSave} disabled={loading} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gold-gradient py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Сохранение...</> : saved ? "✓ Сохранено" : <><Save className="h-4 w-4" /> Сохранить</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

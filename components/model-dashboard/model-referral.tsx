"use client"

import { useState, useEffect } from "react"
import { Copy, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function ModelReferral() {
  const [copied, setCopied] = useState(false)
  const [code, setCode] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("referral_code").eq("id", user.id).single().then(({ data }) => {
          setCode(data?.referral_code || user.id.substring(0, 8))
        })
      }
    })
  }, [])

  const link = `https://huskdlabl.site/register?ref=${code}`

  const handleCopy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Реферальная ссылка</h3>
      <p className="mb-4 text-[11px] text-muted-foreground">Приглашай подруг и получай бонусы</p>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background/30 px-3 py-2.5">
        <span className="flex-1 truncate text-xs font-mono text-muted-foreground">{link}</span>
        <button onClick={handleCopy} className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary transition hover:bg-primary/20">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function ReferralTools() {
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

  const referralLink = `https://huskdlabl.site/register?ref=${code}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="liquid-glass rounded-2xl p-5 lg:p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Your Recruitment Code</h3>
        <p className="text-sm text-muted-foreground">Share to earn commissions on every recruited model</p>
      </div>

      <div className="liquid-glass-inset mb-4 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Referral Link</p>
            <p className="mt-1 text-sm font-mono font-bold text-foreground break-all">{referralLink}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rate</p>
            <p className="text-lg font-bold text-emerald-400">10%</p>
          </div>
        </div>
      </div>

      <Button onClick={handleCopy} className="w-full gap-2 rounded-xl bg-violet-600 hover:bg-violet-700">
        {copied ? <><Check className="h-4 w-4" /> Скопировано!</> : <><Copy className="h-4 w-4" /> Copy Link</>}
      </Button>
    </div>
  )
}

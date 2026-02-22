"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, Circle } from "lucide-react"

const PLATFORMS = [
  { id: "chaturbate", name: "Chaturbate", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  { id: "stripchat", name: "StripChat", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { id: "bongacams", name: "BongaCams", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { id: "skyprivate", name: "SkyPrivate", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "flirt4free", name: "Flirt4Free", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "xmodels", name: "XModels", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
]

export function WorkPoll({ ghostQuery }: { ghostQuery?: string }) {
  const [selected, setSelected] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ghostQuery) { setLoading(false); return }
    fetch("/api/work-log")
      .then(r => r.json())
      .then(d => {
        const today = new Date().toISOString().split("T")[0]
        const todayLog = d.logs?.find((l: any) => l.date === today)
        if (todayLog?.platforms?.length > 0) {
          setSelected(todayLog.platforms)
          setSaved(true)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggle = (id: string) => {
    setSaved(false)
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const save = async () => {
    await fetch("/api/work-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platforms: selected })
    })
    setSaved(true)
  }

  if (ghostQuery || loading) return null

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Где вы работали сегодня?</h3>
        {saved && <span className="text-[10px] text-emerald-400">✓ Сохранено</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
              selected.includes(p.id) ? p.color + " border-current" : "text-muted-foreground bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
            }`}
          >
            {selected.includes(p.id) ? <CheckCircle className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
            {p.name}
          </button>
        ))}
      </div>
      {selected.length > 0 && !saved && (
        <button onClick={save} className="mt-3 w-full rounded-xl bg-primary/10 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition">
          Сохранить
        </button>
      )}
    </div>
  )
}

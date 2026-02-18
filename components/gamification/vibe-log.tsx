"use client"

import { useState, useEffect } from "react"

const vibes = [
  { emoji: "🔥", label: "Огонь", color: "from-orange-500 to-red-500" },
  { emoji: "😊", label: "Хорошо", color: "from-emerald-400 to-green-500" },
  { emoji: "😐", label: "Нормально", color: "from-yellow-400 to-amber-500" },
  { emoji: "😓", label: "Тяжело", color: "from-blue-400 to-indigo-500" },
  { emoji: "💀", label: "Ужас", color: "from-gray-500 to-gray-700" },
]

export function VibeLog({ role = "model" }: { role?: "model" | "recruiter" }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetch("/api/vibe-log")
      .then(r => r.json())
      .then(d => {
        setHistory(d.logs || [])
        // Check if today already logged
        const today = new Date().toISOString().split("T")[0]
        const todayLog = d.logs?.find((l: any) => l.created_at?.startsWith(today))
        if (todayLog) {
          setSelected(todayLog.vibe)
          setSaved(true)
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = async (vibe: string) => {
    setSelected(vibe)
    await fetch("/api/vibe-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vibe, note }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Last 7 days streak
  const last7 = history.slice(0, 7)

  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">{role === "recruiter" ? "Как прошли поиски?" : "Как прошла смена?"}</h3>
          <p className="text-[11px] text-muted-foreground">{saved ? "✓ Сохранено на сегодня" : "Выбери настроение"}</p>
        </div>
        {history.length > 0 && (
          <button onClick={() => setShowHistory(!showHistory)} className="text-[11px] text-muted-foreground hover:text-foreground">
            {showHistory ? "Скрыть" : "История"}
          </button>
        )}
      </div>

      <div className="flex justify-between gap-2">
        {vibes.map(v => (
          <button
            key={v.emoji}
            onClick={() => handleSave(v.emoji)}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl py-3 transition-all ${
              selected === v.emoji
                ? `bg-gradient-to-b ${v.color} shadow-lg scale-105`
                : "bg-white/[0.03] hover:bg-white/[0.06]"
            }`}
          >
            <span className="text-2xl">{v.emoji}</span>
            <span className={`text-[10px] font-medium ${selected === v.emoji ? "text-white" : "text-muted-foreground"}`}>{v.label}</span>
          </button>
        ))}
      </div>

      {showHistory && last7.length > 0 && (
        <div className="mt-3 flex items-center justify-center gap-1.5 pt-3 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground mr-2">Последние:</span>
          {last7.reverse().map((l, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-lg">{l.vibe}</span>
              <span className="text-[8px] text-muted-foreground/50">
                {new Date(l.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

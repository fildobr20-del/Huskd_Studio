"use client"

import { useEffect, useState } from "react"
import { Inbox } from "lucide-react"

interface ModelData {
  id: string
  displayName: string
  platformNick: string
  earnings: number
  joinedAt: string
  hasNicks: boolean
}

export function ModelsTable() {
  const [models, setModels] = useState<ModelData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/recruiter-models")
      .then((r) => r.json())
      .then((d) => { setModels(d.models || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="liquid-glass rounded-2xl p-5 lg:p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Your Models</h3>
        <p className="text-sm text-muted-foreground text-center py-8">Загрузка...</p>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="liquid-glass rounded-2xl p-5 lg:p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Your Models</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="mb-3 h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">Пока нет моделей</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Поделитесь реферальной ссылкой чтобы привлечь моделей</p>
        </div>
      </div>
    )
  }

  return (
    <div className="liquid-glass rounded-2xl p-5 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Your Models</h3>
        <span className="text-xs text-muted-foreground">{models.length} моделей</span>
      </div>
      <div className="flex flex-col gap-2">
        {models.map((m, i) => (
          <div key={m.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3 border border-white/5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-400">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{m.displayName}</p>
                <p className="text-[11px] text-muted-foreground">{m.platformNick}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-400">
                ${(m.earnings * 0.1).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground">ваша комиссия</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

"use client"

import { Inbox } from "lucide-react"

export function ModelsTable() {
  return (
    <div className="liquid-glass rounded-2xl p-5 lg:p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Your Models</h3>
        <p className="text-sm text-muted-foreground">Models you have recruited</p>
      </div>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="mb-3 h-12 w-12 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground">Пока нет моделей</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Поделитесь реферальным кодом чтобы привлечь моделей</p>
      </div>
    </div>
  )
}

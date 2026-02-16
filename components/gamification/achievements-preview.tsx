"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy, DollarSign, Flame, Clock, Zap, Crown, Star, Award, Users, TrendingUp, ChevronRight } from "lucide-react"

const modelAchievements = [
  { id: "first-benjamin", name: "First Benjamin", desc: "Первые $100", icon: DollarSign, threshold: 100 },
  { id: "high-five", name: "High Five", desc: "$5,000 суммарно", icon: Trophy, threshold: 5000 },
  { id: "shark", name: "Shark", desc: "$10,000 за месяц", icon: Crown, threshold: 10000 },
]

const recruiterAchievements = [
  { id: "first-blood", name: "First Blood", desc: "Модель заработала $100", icon: Star, threshold: 100 },
  { id: "talent-scout", name: "Talent Scout", desc: "Модель заработала $1,000", icon: Award, threshold: 1000 },
  { id: "empire", name: "Empire", desc: "Модели заработали $50,000", icon: Crown, threshold: 50000 },
]

export function AchievementsPreview({ role }: { role: "model" | "recruiter" }) {
  const [earnings, setEarnings] = useState(0)

  useEffect(() => {
    fetch("/api/balance")
      .then((r) => r.json())
      .then((d) => setEarnings(role === "model" ? (d.modelShare || 0) : (d.recruiterShare || 0)))
      .catch(() => {})
  }, [role])

  const list = role === "model" ? modelAchievements : recruiterAchievements
  const unlocked = list.filter((a) => earnings >= a.threshold).length

  return (
    <Link href="/achievements">
      <div className="glass glass-highlight rounded-2xl p-5 md:p-6 cursor-pointer transition hover:ring-1 hover:ring-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">Достижения</h3>
            <p className="text-[11px] text-muted-foreground">{unlocked}/{list.length} разблокировано · Нажмите для просмотра</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex gap-3">
          {list.map((a) => {
            const Icon = a.icon
            const isUnlocked = earnings >= a.threshold
            return (
              <div key={a.id} className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl p-3 text-center ${isUnlocked ? "bg-primary/10" : "bg-white/[0.02] opacity-40"}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isUnlocked ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-semibold text-foreground leading-tight">{a.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </Link>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Trophy, DollarSign, Flame, Clock, Zap, Crown, Star, Award, Users, TrendingUp, Target, Rocket, Shield, Heart, Gem, Medal, Sparkles, Sun, Moon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Achievement {
  id: string
  name: string
  desc: string
  icon: any
  category: string
  threshold: number
}

const modelAchievements: Achievement[] = [
  // Money
  { id: "first-benjamin", name: "First Benjamin", desc: "Заработать первые $100", icon: DollarSign, category: "💰 Деньги", threshold: 100 },
  { id: "high-five", name: "High Five", desc: "Суммарный доход $5,000", icon: Trophy, category: "💰 Деньги", threshold: 5000 },
  { id: "shark", name: "Shark of Wall Street", desc: "Доход $10,000 за месяц", icon: Crown, category: "💰 Деньги", threshold: 10000 },
  { id: "crypto-queen", name: "Crypto Queen", desc: "Выплата более $5,000", icon: Zap, category: "💰 Деньги", threshold: 5000 },
  { id: "monthly-record", name: "Monthly Record", desc: "Побить свой рекорд за месяц", icon: TrendingUp, category: "💰 Деньги", threshold: 0 },
  { id: "early-retirement", name: "Early Retirement", desc: "Месячный план за 15 дней", icon: Rocket, category: "💰 Деньги", threshold: 0 },
  // Stability
  { id: "double-trouble", name: "Double Trouble", desc: "Заработать в 2 раза больше чем вчера", icon: Sparkles, category: "🔥 Постоянство", threshold: 0 },
  { id: "weekend-warrior", name: "Weekend Warrior", desc: "Все выходные за месяц отработаны", icon: Shield, category: "🔥 Постоянство", threshold: 0 },
  { id: "stability-icon", name: "Stability Icon", desc: "14 дней подряд с доходом", icon: Target, category: "🔥 Постоянство", threshold: 0 },
  { id: "unstoppable", name: "Unstoppable", desc: "7 дней подряд без выходных", icon: Flame, category: "🔥 Постоянство", threshold: 0 },
  { id: "iron-lady", name: "Iron Lady", desc: "160+ часов за месяц", icon: Clock, category: "🔥 Постоянство", threshold: 0 },
  { id: "climbing-ladder", name: "Climbing the Ladder", desc: "Каждая неделя прибыльнее предыдущей", icon: TrendingUp, category: "🔥 Постоянство", threshold: 0 },
  { id: "perfect-week", name: "Perfect Week", desc: "7 дней выше среднего дохода", icon: Star, category: "🔥 Постоянство", threshold: 0 },
  // Timing
  { id: "morning-star", name: "Morning Star", desc: "30% дохода до 12:00", icon: Sun, category: "⏰ Время", threshold: 0 },
  { id: "night-owl", name: "Night Owl", desc: "10 ночных смен подряд", icon: Moon, category: "⏰ Время", threshold: 0 },
  { id: "early-bird", name: "Early Bird", desc: "5 смен подряд до 09:00", icon: Sparkles, category: "⏰ Время", threshold: 0 },
  // Special
  { id: "phoenix-rising", name: "Phoenix Rising", desc: "Вернулась после 10 дней паузы", icon: Flame, category: "✨ Особые", threshold: 0 },
  { id: "holiday-queen", name: "Holiday Queen", desc: "Работа в праздники", icon: Heart, category: "✨ Особые", threshold: 0 },
  { id: "whale-hunter", name: "Whale Hunter", desc: "Разовый тип > $500", icon: Gem, category: "✨ Особые", threshold: 0 },
  { id: "anniversary", name: "Anniversary", desc: "365 дней с регистрации", icon: Medal, category: "✨ Особые", threshold: 0 },
]

const recruiterAchievements: Achievement[] = [
  { id: "first-blood", name: "First Blood", desc: "Модель заработала первые $100", icon: Star, category: "🎯 Рекрутинг", threshold: 100 },
  { id: "talent-scout", name: "Talent Scout", desc: "Модель заработала $1,000", icon: Award, category: "🎯 Рекрутинг", threshold: 1000 },
  { id: "diamond-scout", name: "Diamond Scout", desc: "Модель достигла 20-го уровня", icon: Gem, category: "🎯 Рекрутинг", threshold: 0 },
  { id: "squad-10", name: "Squad 10", desc: "10 моделей онлайн одновременно", icon: Users, category: "🎯 Рекрутинг", threshold: 0 },
  { id: "retention-master", name: "Retention Master", desc: "Модель активна 6 месяцев", icon: Shield, category: "🎯 Рекрутинг", threshold: 0 },
  { id: "major-domo", name: "Major Domo", desc: "10 активных моделей", icon: Crown, category: "💰 Доход", threshold: 0 },
  { id: "passive-king", name: "Passive Income King", desc: "$500+ реферальных за неделю", icon: DollarSign, category: "💰 Доход", threshold: 500 },
  { id: "empire", name: "Empire Expansion", desc: "Модели заработали $50,000 суммарно", icon: Rocket, category: "💰 Доход", threshold: 50000 },
  { id: "incubator", name: "Incubator", desc: "3 модели побили рекорды одновременно", icon: Sparkles, category: "💰 Доход", threshold: 0 },
  { id: "efficiency-pro", name: "Efficiency Pro", desc: "Средний доход модели выше среднего", icon: TrendingUp, category: "💰 Доход", threshold: 0 },
  { id: "mentor-spirit", name: "Mentor Spirit", desc: "Модель получила Iron Lady", icon: Heart, category: "🏅 Менторство", threshold: 0 },
  { id: "golden-tree", name: "Golden Tree", desc: "3 уровня рекрутера за месяц", icon: Medal, category: "🏅 Менторство", threshold: 0 },
]

export default function AchievementsPage() {
  const [role, setRole] = useState<"model" | "recruiter">("model")
  const [earnings, setEarnings] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("role").eq("id", user.id).single().then(({ data }) => {
          if (data?.role) setRole(data.role as "model" | "recruiter")
        })
      }
    })
    fetch("/api/balance")
      .then((r) => r.json())
      .then((d) => setEarnings(d.modelShare || d.recruiterShare || 0))
      .catch(() => {})
  }, [])

  const achievements = role === "model" ? modelAchievements : recruiterAchievements

  // Group by category
  const categories = [...new Set(achievements.map((a) => a.category))]

  const totalUnlocked = achievements.filter((a) => a.threshold > 0 && earnings >= a.threshold).length

  const dashUrl = role === "recruiter" ? "/dashboard/recruiter" : "/dashboard/model"

  return (
    <div className="relative min-h-screen bg-background">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-15" style={{ background: "radial-gradient(circle, hsla(275, 60%, 40%, 0.6) 0%, transparent 70%)" }} />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        <Link href={dashUrl} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Назад в кабинет
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">🏆 Достижения</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalUnlocked} из {achievements.length} разблокировано · Зарабатывай чтобы открывать новые
          </p>
        </div>

        {categories.map((cat) => (
          <div key={cat} className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">{cat}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {achievements.filter((a) => a.category === cat).map((a) => {
                const Icon = a.icon
                const unlocked = a.threshold > 0 && earnings >= a.threshold
                return (
                  <div key={a.id} className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition ${unlocked ? "bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5" : "bg-white/[0.03] border border-white/5 opacity-50"}`}>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${unlocked ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-foreground leading-tight">{a.name}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{a.desc}</span>
                    {unlocked && <span className="text-[9px] font-bold text-primary">✓ UNLOCKED</span>}
                    {!unlocked && a.threshold > 0 && (
                      <span className="text-[9px] text-muted-foreground/50">${a.threshold.toLocaleString()}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

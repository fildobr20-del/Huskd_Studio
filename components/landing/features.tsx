"use client"

import { Settings, GraduationCap, Wrench, TrendingUp, Wallet } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  index: number
}

function FeatureCard({ icon: Icon, title, description, index }: FeatureCardProps) {
  return (
    <div
      className="group relative rounded-2xl glass p-7 transition-all duration-500 hover:glow-gold hover:border-primary/20"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient/10 transition-colors duration-300 group-hover:bg-gold-gradient/20">
        <Icon size={22} className="text-primary" />
      </div>
      <h3 className="mb-3 font-serif text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "linear-gradient(135deg, hsla(43, 56%, 55%, 0.03) 0%, transparent 100%)" }} />
    </div>
  )
}

const features = [
  {
    icon: Settings,
    title: "Полная настройка профилей",
    description:
      "Берём на себя регистрацию, верификацию и профессиональную настройку профилей на всех выбранных сайтах. Ты не тратишь время — мы всё делаем за тебя.",
  },
  {
    icon: GraduationCap,
    title: "Обучение от топ-моделей",
    description:
      "Действующие топ-модели бесплатно обучают тебя по аудио/видео-связи с удалённым экраном. Проверенные техники для роста заработка + неограниченные персональные консультации.",
  },
  {
    icon: Wrench,
    title: "Техническая поддержка",
    description:
      "Решаем любые технические сложности: оборудование, софт, настройки ПК. Наши специалисты подключаются удалённо и быстро всё приводят в порядок.",
  },
  {
    icon: TrendingUp,
    title: "Продвижение анкет",
    description:
      "Активно продвигаем твои анкеты, поднимаем их в топ поиска — ты окажешься в первых строках выдачи буквально с первого дня работы.",
  },
  {
    icon: Wallet,
    title: "Гибкие выплаты",
    description:
      "Выплаты каждую неделю на карты, крипту или любые удобные системы. Нужны деньги срочно? — просто оставь заявку на досрочный вывод.",
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-28 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {"Что мы предлагаем"}
          </span>
          <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
            {"Всё для твоего "}
            <span className="text-gold">{"успеха"}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {"Мы подбираем категории и платформы строго под твои предпочтения, чтобы работа приносила максимум удовольствия и дохода."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} {...feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

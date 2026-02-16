"use client"

import { Monitor, Languages, MessageCircle } from "lucide-react"

const supportItems = [
  {
    icon: Monitor,
    title: "Настройка через удалённый доступ",
    description: "Настраиваем технику, программы и трансляцию через удалённый доступ к твоему компьютеру",
  },
  {
    icon: Languages,
    title: "Автоматический переводчик",
    description: "Устанавливаем автоматический переводчик — английский не обязателен",
  },
  {
    icon: MessageCircle,
    title: "Круглосуточный чат поддержки",
    description: "Любой вопрос решается максимум за 2 минуты — мы всегда на связи",
  },
]

export function Support() {
  return (
    <section id="support" className="relative py-28 px-6">
      {/* Decorative divider */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left */}
          <div>
            <span className="mb-4 inline-block text-sm font-medium uppercase tracking-[0.2em] text-primary">
              {"Поддержка 24/7"}
            </span>
            <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl text-balance">
              {"Полная поддержка "}
              <span className="text-gold">{"прямо во время"}</span>
              {" стрима"}
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              {"За тобой стоит целая команда: регистраторы, операторы, личные тренеры и технари. Именно поэтому модели в Husk'd Labl стабильно выходят на высокий доход."}
            </p>
          </div>

          {/* Right — cards */}
          <div className="flex flex-col gap-5">
            {supportItems.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="group flex items-start gap-5 rounded-2xl glass p-6 transition-all duration-500 hover:glow-gold hover:border-primary/20"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-gradient/10 transition-colors duration-300 group-hover:bg-gold-gradient/20">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-serif text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

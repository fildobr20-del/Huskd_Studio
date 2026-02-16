"use client"

import { UserPlus, FileText, ShieldCheck, Headphones, Play } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    title: "Регистрация на сайте",
    description: "Займёт меньше минуты — быстрый и простой старт",
  },
  {
    icon: FileText,
    title: "Заполняешь анкету",
    description: "Немного о себе, контакты и фото — всё конфиденциально",
  },
  {
    icon: ShieldCheck,
    title: "Проверка документов",
    description: "Подтверждение возраста 18+ — безопасность прежде всего",
  },
  {
    icon: Headphones,
    title: "Персональное обучение",
    description: "Получаешь обучение + полную техническую настройку от команды",
  },
  {
    icon: Play,
    title: "Запуск стрима",
    description: "Начинаешь зарабатывать с первого дня при нашей поддержке",
  },
]

export function Steps() {
  return (
    <section id="steps" className="relative py-28 px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {"5 простых шагов"}
          </span>
          <h2 className="font-serif text-2xl font-bold text-foreground sm:text-4xl md:text-5xl text-balance">
            {"Как быстро начать зарабатывать с "}
            <span className="text-gold">{"Husk'd Labl"}</span>
          </h2>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-primary/40 via-accent/40 to-transparent md:left-1/2 md:block" />

          <div className="flex flex-col gap-12">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isEven = i % 2 === 0
              return (
                <div
                  key={step.title}
                  className={`relative flex flex-col items-start gap-6 md:flex-row md:items-center ${
                    isEven ? "" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${isEven ? "md:text-right md:pr-16" : "md:text-left md:pl-16"}`}>
                    <div className={`inline-flex flex-col ${isEven ? "md:items-end" : "md:items-start"}`}>
                      <h3 className="font-serif text-xl font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Center icon */}
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-gradient shadow-[0_0_20px_hsla(43,56%,55%,0.3)] md:mx-0">
                    <Icon size={20} className="text-background" />
                  </div>

                  {/* Spacer for the other side */}
                  <div className="hidden flex-1 md:block" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

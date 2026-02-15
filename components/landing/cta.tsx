"use client"

import { ArrowRight, Sparkles } from "lucide-react"

export function CTA() {
  return (
    <section id="cta" className="relative py-28 px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl p-1">
          {/* Animated border gradient */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background:
                "linear-gradient(135deg, hsla(43, 56%, 55%, 0.4) 0%, hsla(275, 60%, 40%, 0.3) 50%, hsla(43, 56%, 55%, 0.4) 100%)",
            }}
          />

          <div className="relative rounded-[22px] px-8 py-16 text-center md:px-16 md:py-20" style={{
            background: "linear-gradient(135deg, hsl(270, 30%, 8%) 0%, hsl(275, 35%, 12%) 50%, hsl(270, 30%, 8%) 100%)"
          }}>
            {/* Glow */}
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 opacity-20"
              style={{
                background:
                  "radial-gradient(ellipse, hsla(43, 56%, 55%, 0.6) 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full glass-gold px-5 py-2.5">
                <Sparkles size={16} className="text-primary" />
                <span className="text-sm font-medium tracking-wide text-primary">
                  {"Бесплатная регистрация"}
                </span>
              </div>

              <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl lg:text-6xl text-balance">
                {"Готова начать "}
                <span className="text-gold">{"зарабатывать"}</span>
                {"?"}
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {"Регистрация займёт меньше минуты. Заполняй анкету, проходи обучение и начинай стримить с полной поддержкой нашей команды."}
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <a
                  href="/register"
                  className="group inline-flex items-center gap-3 rounded-full bg-gold-gradient px-10 py-4 text-base font-semibold text-background transition-all duration-300 hover:shadow-[0_0_40px_hsla(43,56%,55%,0.35)]"
                >
                  <span>{"Зарегистрироваться"}</span>
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </a>
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                {"Без скрытых платежей. Полная конфиденциальность."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

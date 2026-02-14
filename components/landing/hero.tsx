"use client"

import { useEffect, useRef } from "react"
import { ArrowDown, Sparkles } from "lucide-react"

export function Hero() {
  const orbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!orbRef.current) return
      const x = (e.clientX / window.innerWidth - 0.5) * 30
      const y = (e.clientY / window.innerHeight - 0.5) * 30
      orbRef.current.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          ref={orbRef}
          className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 transition-transform duration-700 ease-out"
          style={{
            background:
              "radial-gradient(circle, hsla(275, 60%, 35%, 0.5) 0%, hsla(43, 56%, 55%, 0.08) 60%, transparent 80%)",
          }}
        />
        <div
          className="absolute right-1/4 top-2/3 h-[300px] w-[300px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, hsla(43, 56%, 55%, 0.4) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute left-1/4 bottom-1/4 h-[200px] w-[200px] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, hsla(275, 60%, 50%, 0.5) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full glass-gold px-5 py-2.5">
          <Sparkles size={16} className="text-primary" />
          <span className="text-sm font-medium tracking-wide text-primary">
            {"С 2019 года в индустрии"}
          </span>
        </div>

        <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight md:text-7xl lg:text-8xl">
          <span className="text-foreground">{"Твой путь к "}</span>
          <span className="text-gold">{"высокому"}</span>
          <br />
          <span className="text-gold">{"доходу"}</span>
          <span className="text-foreground">{" начинается"}</span>
          <br />
          <span className="text-foreground">{"здесь"}</span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {"Husk'd Labl — твой надёжный партнёр в вебкам-индустрии. Подбираем категории и платформы строго под твои предпочтения, чтобы работа приносила максимум удовольствия и дохода."}
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="/login"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gold-gradient px-8 py-4 text-base font-semibold text-background transition-all duration-300 hover:shadow-[0_0_30px_hsla(43,56%,55%,0.3)]"
          >
            <span className="relative z-10">{"Начать зарабатывать"}</span>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,hsla(0,0%,100%,0.2)_50%,transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium text-foreground transition-all duration-300 glass hover:border-primary/30"
          >
            {"Узнать больше"}
          </a>
        </div>

        <div className="mt-20 flex animate-bounce justify-center">
          <a href="#features" aria-label="Прокрутить вниз">
            <ArrowDown size={20} className="text-muted-foreground" />
          </a>
        </div>
      </div>
    </section>
  )
}

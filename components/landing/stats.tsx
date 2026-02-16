"use client"

import { useEffect, useRef, useState } from "react"

interface StatItemProps {
  value: string
  label: string
  suffix?: string
}

function useCountUp(target: number, duration: number, isVisible: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, isVisible])

  return count
}

const stats: { value: number; display: string; label: string; suffix: string }[] = [
  { value: 32400, display: "32 400", label: "Созданных и верифицированных анкет", suffix: "+" },
  { value: 100, display: "100", label: "Новых моделей ежедневно", suffix: "+" },
  { value: 70, display: "50–70", label: "Средний заработок за 2–3 часа", suffix: " $" },
]

export function Stats() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const count0 = useCountUp(stats[0].value, 2000, isVisible)
  const count1 = useCountUp(stats[1].value, 1500, isVisible)
  const count2 = useCountUp(stats[2].value, 1200, isVisible)
  const counts = [count0, count1, count2]

  return (
    <section id="stats" ref={sectionRef} className="relative py-28 px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {"Наши результаты"}
          </span>
          <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
            {"Цифры говорят "}
            <span className="text-gold">{"сами за себя"}</span>
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="group rounded-2xl glass-gold p-8 text-center transition-all duration-500 hover:glow-gold"
            >
              <div className="text-gold font-serif text-5xl font-bold md:text-6xl">
                {i === 2 ? (
                  <>
                    {"50–"}
                    {counts[i]}
                    {stat.suffix}
                  </>
                ) : (
                  <>
                    {counts[i].toLocaleString("ru-RU")}
                    {stat.suffix}
                  </>
                )}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

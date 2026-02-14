"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass py-3" : "bg-transparent py-5"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Husk'd Labl логотип"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="font-serif text-xl font-bold tracking-wide text-foreground">
            {"Husk'd Labl"}
          </span>
        </a>

        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Войти
          </a>
          <a
            href="/login"
            className="rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-semibold text-background transition-all duration-300 hover:opacity-90 hover:shadow-lg"
          >
            Начать сейчас
          </a>
        </div>
      </nav>
    </header>
  )
}

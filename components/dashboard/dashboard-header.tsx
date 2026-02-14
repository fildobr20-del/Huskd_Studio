"use client"

import Image from "next/image"
import { Bell, Settings, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"

export function DashboardHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 liquid-glass-elevated overflow-hidden rounded-none">
      {/* Top specular edge highlight */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
      />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Logo with 3D glass frame */}
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl liquid-glass-inset">
            <Image
              src="/logo.jpg"
              alt="Husk'd Label logo"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
            {/* Inner highlight ring */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl"
              style={{
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 1px rgba(0,0,0,0.3)",
              }}
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-foreground tracking-tight">
              {"Husk'd Label"}
            </h1>
            <p className="text-[11px] text-muted-foreground">Recruiter Portal</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {["Overview", "Models", "Earnings", "Referrals"].map((item, i) => (
            <Button
              key={item}
              variant="ghost"
              size="sm"
              className={
                i === 0
                  ? "relative liquid-glass rounded-xl text-foreground border-none shadow-none px-4 py-1.5"
                  : "relative text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent transition-colors duration-300"
              }
            >
              <span className="relative z-10">{item}</span>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent transition-colors duration-300"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-500 shadow-md shadow-violet-500/50" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent transition-colors duration-300 sm:flex"
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
          <div className="mx-1 hidden h-6 w-px bg-gradient-to-b from-transparent via-foreground/10 to-transparent sm:block" />
          {/* Avatar with glass ring */}
          <div className="relative rounded-full p-[2px] bg-gradient-to-br from-violet-500/30 via-transparent to-blue-500/30">
            <Avatar className="h-8 w-8 liquid-glass-inset border-none">
              <AvatarFallback className="bg-transparent text-xs font-semibold text-violet-300">
                JD
              </AvatarFallback>
            </Avatar>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="border-t border-foreground/5 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {["Overview", "Models", "Earnings", "Referrals"].map((item, i) => (
              <Button
                key={item}
                variant="ghost"
                size="sm"
                className={`justify-start ${
                  i === 0
                    ? "liquid-glass rounded-xl text-foreground border-none shadow-none"
                    : "text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </Button>
            ))}
          </div>
        </nav>
      )}

      {/* Bottom edge refraction line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
      />
    </header>
  )
}

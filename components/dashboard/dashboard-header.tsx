"use client"

import Image from "next/image"
import Link from "next/link"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  return (
    <header className="liquid-glass sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Husk'd Label" width={36} height={36} className="rounded-xl" />
            <div>
              <p className="text-sm font-semibold text-foreground">{"Husk'd Label"}</p>
              <p className="text-xs text-muted-foreground">Recruiter Portal</p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" className="rounded-xl bg-white/5 text-foreground">Overview</Button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">R</div>
        </div>
      </div>
    </header>
  )
}

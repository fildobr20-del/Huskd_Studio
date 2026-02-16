"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Settings, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <header className="glass-header sticky top-0 z-50 flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center gap-3">
        <Image src="/logo-purple.svg" alt="Husk'd Label" width={40} height={40} className="rounded-xl" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">{"Husk'd Label"}</h1>
          <p className="text-xs text-muted-foreground">Model Dashboard</p>
        </div>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <Link href="/onboarding">
          <Button variant="ghost" size="sm" className="glass-pill gap-2 rounded-xl text-primary hover:text-primary/80 border border-primary/20">
            <Link2 className="h-4 w-4" />
            <span className="hidden text-sm md:inline">Платформы</span>
          </Button>
        </Link>
        <a href="https://t.me/usernamesks" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="glass-pill gap-2 rounded-xl text-muted-foreground hover:text-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden text-sm md:inline">Contact Mentor</span>
          </Button>
        </a>
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
}

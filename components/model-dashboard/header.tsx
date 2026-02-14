"use client";

import Image from "next/image";
import { MessageCircle, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DashboardHeader() {
  return (
    <header className="glass-header sticky top-0 z-50 flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Image
            src="/huskd-logo.jpg"
            alt="Husk'd Label logo"
            width={40}
            height={40}
            className="rounded-xl ring-1 ring-white/10"
          />
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
            {"Husk'd Label"}
          </h1>
          <p className="text-xs text-muted-foreground">Model Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(212,115,140,0.5)]" />
                <span className="sr-only">Notifications</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="glass-pill gap-2 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden text-sm md:inline">Contact Mentor</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat with your mentor</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Payment Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}

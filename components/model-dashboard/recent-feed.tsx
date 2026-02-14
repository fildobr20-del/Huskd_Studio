"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpRight, CheckCircle2, Clock, Ban } from "lucide-react";

const payouts = [
  {
    id: 1,
    method: "Wire Transfer",
    amount: "$2,150.00",
    date: "Feb 1, 2026",
    status: "completed" as const,
  },
  {
    id: 2,
    method: "Paxum",
    amount: "$1,890.00",
    date: "Jan 15, 2026",
    status: "completed" as const,
  },
  {
    id: 3,
    method: "Wire Transfer",
    amount: "$980.50",
    date: "Jan 1, 2026",
    status: "completed" as const,
  },
  {
    id: 4,
    method: "Paxum",
    amount: "$2,340.00",
    date: "Dec 15, 2025",
    status: "completed" as const,
  },
  {
    id: 5,
    method: "Wire Transfer",
    amount: "$4,280.50",
    date: "Feb 15, 2026",
    status: "pending" as const,
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
    borderClass: "border-emerald-400/20",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    textClass: "text-amber-400",
    bgClass: "bg-amber-400/10",
    borderClass: "border-amber-400/20",
  },
  failed: {
    icon: Ban,
    label: "Failed",
    textClass: "text-red-400",
    bgClass: "bg-red-400/10",
    borderClass: "border-red-400/20",
  },
};

export function RecentFeed() {
  return (
    <div className="glass-raised glass-highlight relative overflow-hidden rounded-2xl">
      <div className="relative z-10 p-5 pb-3 md:p-6 md:pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Payouts
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your payout history
            </p>
          </div>
          <button
            type="button"
            className="glass-pill flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View All
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="relative z-10 p-0">
        <ScrollArea className="h-[280px] px-5 pb-5 md:h-[320px] md:px-6 md:pb-6">
          <div className="flex flex-col gap-2.5">
            {payouts.map((payout) => {
              const config = statusConfig[payout.status];
              const StatusIcon = config.icon;

              return (
                <div
                  key={payout.id}
                  className="glass-inset glass-float flex items-center gap-3 rounded-xl p-3.5 transition-all"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.bgClass} border ${config.borderClass}`}
                  >
                    <StatusIcon className={`h-4 w-4 ${config.textClass}`} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {payout.method}
                      </span>
                      <span
                        className={`font-mono text-sm font-semibold ${
                          payout.status === "pending"
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {payout.status === "pending" ? "" : ""}
                        {payout.amount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {payout.date}
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.textClass} ${config.bgClass}`}
                      >
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

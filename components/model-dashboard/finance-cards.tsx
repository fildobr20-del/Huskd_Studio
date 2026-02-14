"use client";

import { DollarSign, TrendingUp, Calendar } from "lucide-react";

const cards = [
  {
    label: "Current Balance",
    value: "$4,280.50",
    change: "+$320 this week",
    icon: DollarSign,
    isPrimary: true,
  },
  {
    label: "Total Lifetime Earnings",
    value: "$87,412.00",
    change: "+12% vs last month",
    icon: TrendingUp,
    isPrimary: false,
  },
  {
    label: "Estimated Payout Date",
    value: "Feb 15",
    change: "Next payout in 5 days",
    icon: Calendar,
    isPrimary: false,
  },
];

export function FinanceCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`glass-highlight glass-float relative overflow-hidden rounded-2xl ${
            card.isPrimary ? "glass-primary glass-shimmer" : "glass-raised"
          }`}
        >
          <div className="relative z-10 flex items-start justify-between p-5 md:p-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {card.label}
              </span>
              <span
                className={`text-2xl font-bold tracking-tight md:text-3xl ${
                  card.isPrimary ? "text-primary" : "text-foreground"
                }`}
              >
                {card.value}
              </span>
              <span className="text-xs text-muted-foreground">
                {card.change}
              </span>
            </div>
            <div
              className={`rounded-xl p-2.5 ${
                card.isPrimary
                  ? "bg-primary/15 text-primary shadow-[0_0_12px_rgba(212,115,140,0.15)]"
                  : "glass-inset text-muted-foreground"
              }`}
            >
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

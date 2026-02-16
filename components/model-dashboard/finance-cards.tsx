"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Calendar, Link2 } from "lucide-react";

interface BalanceData {
  totalGross: number;
  modelShare: number;
  platformBreakdown: { name: string; amount: number }[];
  message?: string;
}

export function FinanceCards() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/balance")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const balance = data?.modelShare ?? 0;
  const gross = data?.totalGross ?? 0;
  const hasNicks = !data?.message;

  const cards = [
    {
      label: "Current Balance",
      value: loading ? "..." : `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      change: hasNicks ? "70% от общего дохода" : "Привяжите платформы",
      icon: hasNicks ? DollarSign : Link2,
      isPrimary: true,
      link: hasNicks ? undefined : "/onboarding",
    },
    {
      label: "Total Gross",
      value: loading ? "..." : `$${gross.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      change: "Все платформы",
      icon: TrendingUp,
      isPrimary: false,
    },
    {
      label: "Estimated Payout",
      value: "Weekly",
      change: "Каждый вторник",
      icon: Calendar,
      isPrimary: false,
      link: undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
      {cards.map((card) => (
        <a
          key={card.label}
          href={card.link}
          className={`glass-highlight glass-float relative overflow-hidden rounded-2xl ${
            card.isPrimary ? "glass-primary glass-shimmer" : "glass-raised"
          } ${card.link ? "cursor-pointer ring-1 ring-primary/30" : ""}`}
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
              <span className={`text-xs ${card.link ? "text-primary font-medium" : "text-muted-foreground"}`}>
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
        </a>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, Calendar, Link2 } from "lucide-react";

export function FinanceCards({ ghostQuery = "" }: { ghostQuery?: string }) {
  const [balance, setBalance] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasNicks, setHasNicks] = useState(false);

  useEffect(() => {
    fetch(`/api/balance${ghostQuery}`)
      .then((r) => r.json())
      .then((d) => {
        setBalance(d.modelShare ?? 0);
        setLifetime(d.lifetime ?? 0);
        setHasNicks(!d.message);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ghostQuery]);

  const cards = [
    {
      label: "БАЛАНС",
      value: loading ? "..." : `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      change: hasNicks ? "К выводу" : "Привяжите платформы →",
      icon: hasNicks ? DollarSign : Link2,
      isPrimary: true,
      link: hasNicks ? undefined : "/onboarding",
    },
    {
      label: "ЗА ВСЁ ВРЕМЯ",
      value: loading ? "..." : `$${(lifetime * 0.7).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      change: "Накопительный итог",
      icon: TrendingUp,
      isPrimary: false,
      link: undefined,
    },
    {
      label: "ВЫПЛАТЫ",
      value: "Weekly",
      change: "Каждый вторник",
      icon: Calendar,
      isPrimary: false,
      link: undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
      {cards.map((card) => {
        const content = (
          <div className={`glass-highlight glass-float relative overflow-hidden rounded-2xl ${card.isPrimary ? "glass-primary glass-shimmer" : "glass-raised"} ${card.link ? "cursor-pointer ring-1 ring-primary/30" : ""}`}>
            <div className="relative z-10 flex items-start justify-between p-5 md:p-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{card.label}</span>
                <span className={`text-2xl font-bold tracking-tight md:text-3xl ${card.isPrimary ? "text-primary" : "text-foreground"}`}>{card.value}</span>
                <span className={`text-xs ${card.link ? "text-primary font-medium" : "text-muted-foreground"}`}>{card.change}</span>
              </div>
              <div className={`rounded-xl p-2.5 ${card.isPrimary ? "bg-primary/15 text-primary" : "glass-inset text-muted-foreground"}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
        return card.link ? <Link key={card.label} href={card.link}>{content}</Link> : <div key={card.label}>{content}</div>;
      })}
    </div>
  );
}

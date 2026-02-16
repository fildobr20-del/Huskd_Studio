"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, Calendar, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BalanceData {
  totalGross: number;
  modelShare: number;
  platformBreakdown: { name: string; amount: number }[];
  message?: string;
}

export function FinanceCards() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [lifetime, setLifetime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasNicks, setHasNicks] = useState(false);

  useEffect(() => {
    // Fetch current balance
    fetch("/api/balance")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setHasNicks(!d.message);
        setLoading(false);

        // Update lifetime in profile
        if (d.modelShare > 0) {
          const supabase = createClient();
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase.from("profiles").select("total_lifetime_earnings").eq("id", user.id).single().then(({ data: prof }) => {
                const current = prof?.total_lifetime_earnings || 0;
                if (d.modelShare > current) {
                  supabase.from("profiles").update({ total_lifetime_earnings: d.modelShare }).eq("id", user.id);
                }
                setLifetime(Math.max(current, d.modelShare));
              });
            }
          });
        }
      })
      .catch(() => setLoading(false));

    // Also load lifetime
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("total_lifetime_earnings").eq("id", user.id).single().then(({ data: prof }) => {
          if (prof?.total_lifetime_earnings) setLifetime(prof.total_lifetime_earnings);
        });
      }
    });
  }, []);

  const balance = data?.modelShare ?? 0;

  const cards = [
    {
      label: "CURRENT BALANCE",
      value: loading ? "..." : `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      change: hasNicks ? "70% от общего дохода" : "Привяжите платформы →",
      icon: hasNicks ? DollarSign : Link2,
      isPrimary: true,
      link: hasNicks ? undefined : "/onboarding",
    },
    {
      label: "TOTAL LIFETIME",
      value: loading ? "..." : `$${lifetime.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      change: "За всё время",
      icon: TrendingUp,
      isPrimary: false,
      link: undefined,
    },
    {
      label: "PAYOUT SCHEDULE",
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
        const Wrapper = card.link ? Link : "div";
        const wrapperProps = card.link ? { href: card.link } : {};
        return (
          <Wrapper key={card.label} {...(wrapperProps as any)} className={`glass-highlight glass-float relative overflow-hidden rounded-2xl ${card.isPrimary ? "glass-primary glass-shimmer" : "glass-raised"} ${card.link ? "cursor-pointer ring-1 ring-primary/30" : ""}`}>
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
          </Wrapper>
        );
      })}
    </div>
  );
}

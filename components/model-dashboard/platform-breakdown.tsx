"use client";

import { useEffect, useState } from "react";

interface PlatformData {
  name: string;
  amount: number;
  tokens?: number;
}

const platformColors: Record<string, { bg: string; text: string; bar: string }> = {
  StripChat: { bg: "bg-red-500/10", text: "text-red-400", bar: "bg-red-500" },
  Chaturbate: { bg: "bg-orange-500/10", text: "text-orange-400", bar: "bg-orange-500" },
  BongaCams: { bg: "bg-purple-500/10", text: "text-purple-400", bar: "bg-purple-500" },
  SkyPrivate: { bg: "bg-blue-500/10", text: "text-blue-400", bar: "bg-blue-500" },
  "Flirt4Free": { bg: "bg-pink-500/10", text: "text-pink-400", bar: "bg-pink-500" },
};

const defaultPlatforms: PlatformData[] = [
  { name: "Chaturbate", amount: 0 },
  { name: "StripChat", amount: 0 },
  { name: "BongaCams", amount: 0 },
  { name: "SkyPrivate", amount: 0 },
  { name: "Flirt4Free", amount: 0 },
];

export function PlatformBreakdown() {
  const [platforms, setPlatforms] = useState<PlatformData[]>(defaultPlatforms);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/balance")
      .then((r) => r.json())
      .then((d) => {
        if (d.platformBreakdown && d.platformBreakdown.length > 0) {
          // Merge API data with defaults to always show all platforms
          const merged = defaultPlatforms.map((dp) => {
            const found = d.platformBreakdown.find((p: PlatformData) => p.name === dp.name);
            return found || dp;
          });
          setPlatforms(merged);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const maxAmount = Math.max(...platforms.map((p) => p.amount), 1);

  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">Platform Breakdown</h3>
        <p className="text-[11px] text-muted-foreground">Заработок за текущий месяц</p>
      </div>
      <div className="flex flex-col gap-3.5">
        {platforms.map((p) => {
          const colors = platformColors[p.name] || { bg: "bg-gray-500/10", text: "text-gray-400", bar: "bg-gray-500" };
          const abbr = p.name.substring(0, 2).toUpperCase();
          return (
            <div key={p.name} className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                <span className={`text-[10px] font-bold ${colors.text}`}>{abbr}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <span className="text-sm font-bold text-foreground">
                    {loading ? "..." : `$${p.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
                  <div className={`h-full rounded-full ${colors.bar} transition-all duration-500`} style={{ width: `${maxAmount > 0 ? (p.amount / maxAmount) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground/40 text-center">
        CB, SC, BC — ежедневно · F4F, SP, XM — по вторникам
      </p>
    </div>
  );
}

"use client";

import { ExternalLink } from "lucide-react";

const platforms = [
  {
    name: "Stripchat",
    earned: "$1,840.00",
    color: "#e74c3c",
    initial: "SC",
    trend: "+8%",
  },
  {
    name: "Chaturbate",
    earned: "$1,260.00",
    color: "#f39c12",
    initial: "CB",
    trend: "+3%",
  },
  {
    name: "SkyPrivate",
    earned: "$720.00",
    color: "#3498db",
    initial: "SP",
    trend: "+15%",
  },
  {
    name: "Flirt4Free",
    earned: "$460.50",
    color: "#9b59b6",
    initial: "FF",
    trend: "-2%",
  },
];

export function PlatformBreakdown() {
  const total = 4280.5;

  return (
    <div className="glass-raised glass-highlight relative overflow-hidden rounded-2xl">
      <div className="relative z-10 p-5 pb-3 md:p-6 md:pb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Platform Breakdown
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {"This month's earnings by site"}
        </p>
      </div>
      <div className="relative z-10 flex flex-col gap-2.5 px-5 pb-5 md:px-6 md:pb-6">
        {platforms.map((platform) => {
          const amount = Number.parseFloat(
            platform.earned.replace(/[$,]/g, "")
          );
          const percentage = ((amount / total) * 100).toFixed(0);

          return (
            <div
              key={platform.name}
              className="glass-inset glass-float group flex items-center gap-3 rounded-xl p-3 transition-all"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                style={{
                  background: `linear-gradient(135deg, ${platform.color}25, ${platform.color}10)`,
                  color: platform.color,
                  boxShadow: `0 0 12px ${platform.color}15, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  border: `1px solid ${platform.color}20`,
                }}
              >
                {platform.initial}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {platform.name}
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {platform.earned}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${platform.color}90, ${platform.color})`,
                        boxShadow: `0 0 8px ${platform.color}40`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      platform.trend.startsWith("+")
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {platform.trend}
                  </span>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

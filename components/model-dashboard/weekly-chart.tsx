"use client";

import { useEffect, useState } from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyChart() {
  const [earnings, setEarnings] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/balance")
      .then((r) => r.json())
      .then((d) => {
        setTotal(d.modelShare || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const maxVal = Math.max(...earnings, 1);

  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
            Weekly Performance
          </h3>
          <p className="text-[11px] text-muted-foreground">Last 7 days earnings</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">
            {loading ? "..." : `$${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          </p>
          <p className="text-[11px] text-muted-foreground">Ваша доля (70%)</p>
        </div>
      </div>

      <div className="flex h-40 items-end gap-2">
        {days.map((day, i) => (
          <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="w-full overflow-hidden rounded-t-lg bg-white/5" style={{ height: "100%" }}>
              <div
                className="mt-auto w-full rounded-t-lg bg-gradient-to-t from-primary/60 to-primary/20 transition-all duration-500"
                style={{ height: `${maxVal > 0 ? (earnings[i] / maxVal) * 100 : 2}%`, marginTop: "auto" }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>
      {total === 0 && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Привяжите ники платформ чтобы видеть статистику
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getLast7Days(): string[] {
  const dates: string[] = [];
  const now = new Date();
  // Find last Monday
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export function WeeklyChart({ ghostQuery = "" }: { ghostQuery?: string }) {
  const [earnings, setEarnings] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dates = getLast7Days();
    fetch(`/api/earnings-daily?year=${new Date().getFullYear()}${ghostQuery ? "&" + ghostQuery.substring(1) : ""}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, number> = {};
        d.earnings?.forEach((e: any) => { map[e.date] = (map[e.date] || 0) + e.amount });
        setEarnings(dates.map(date => Math.round((map[date] || 0) * 100) / 100));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const total = earnings.reduce((s, v) => s + v, 0);
  const maxVal = Math.max(...earnings, 1);
  const bestIdx = earnings.indexOf(Math.max(...earnings));

  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">Weekly Performance</h3>
          <p className="text-[11px] text-muted-foreground">Текущая неделя</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">
            {loading ? "..." : `$${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          </p>
          {total > 0 && <p className="text-[11px] text-muted-foreground">Best: {dayNames[bestIdx]} (${Math.round(earnings[bestIdx])})</p>}
        </div>
      </div>

      <div className="flex h-40 items-end gap-1.5 sm:gap-2">
        {dayNames.map((day, i) => (
          <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="relative w-full flex flex-col justify-end" style={{ height: "130px" }}>
              <div
                className={`w-full rounded-t-lg transition-all duration-700 ${i === bestIdx && earnings[i] > 0 ? "bg-gradient-to-t from-primary/80 to-primary/40" : "bg-gradient-to-t from-primary/40 to-primary/15"}`}
                style={{ height: `${maxVal > 0 ? (earnings[i] / maxVal) * 100 : 2}%`, minHeight: earnings[i] > 0 ? "4px" : "2px" }}
              />
              {earnings[i] > 0 && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-medium text-muted-foreground">
                  ${Math.round(earnings[i])}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>

      {total === 0 && !loading && (
        <p className="mt-4 text-center text-xs text-muted-foreground">Данные появятся после внесения доходов</p>
      )}
    </div>
  );
}

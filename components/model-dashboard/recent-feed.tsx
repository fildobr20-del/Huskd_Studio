"use client";

import { Clock, Inbox } from "lucide-react";

export function RecentFeed() {
  return (
    <div className="glass glass-highlight rounded-2xl p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
          Recent Payouts
        </h3>
        <p className="text-[11px] text-muted-foreground">Your payout history</p>
      </div>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Inbox className="mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Пока нет выплат</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Выплаты появятся здесь автоматически</p>
      </div>
    </div>
  );
}

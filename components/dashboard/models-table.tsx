"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const models = [
  {
    name: "Anna K.",
    dateJoined: "2025-12-15",
    revenue: 12400,
    status: "active",
  },
  {
    name: "Maria S.",
    dateJoined: "2025-11-03",
    revenue: 9800,
    status: "active",
  },
  {
    name: "Elena V.",
    dateJoined: "2025-10-22",
    revenue: 8200,
    status: "active",
  },
  {
    name: "Sofia R.",
    dateJoined: "2025-09-18",
    revenue: 7500,
    status: "active",
  },
  {
    name: "Diana M.",
    dateJoined: "2025-08-05",
    revenue: 6100,
    status: "inactive",
  },
  {
    name: "Lana P.",
    dateJoined: "2025-07-12",
    revenue: 4800,
    status: "active",
  },
  {
    name: "Vera T.",
    dateJoined: "2026-01-08",
    revenue: 3200,
    status: "active",
  },
  {
    name: "Nina B.",
    dateJoined: "2026-01-20",
    revenue: 1900,
    status: "active",
  },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function ModelsTable() {
  const totalRevenue = models.reduce((sum, m) => sum + m.revenue, 0)

  return (
    <div className="relative overflow-hidden rounded-3xl liquid-glass">
      {/* Top specular edge */}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-foreground/8 to-transparent"
      />
      {/* Internal refraction orbs */}
      <div
        aria-hidden="true"
        className="absolute -left-16 top-1/4 h-40 w-40 rounded-full bg-violet-500/[0.04] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-16 bottom-1/4 h-40 w-40 rounded-full bg-blue-500/[0.04] blur-3xl"
      />

      <div className="relative z-10">
        <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Your Models
            </h2>
            <p className="text-sm text-muted-foreground">
              Revenue breakdown for each recruited model
            </p>
          </div>
          <Badge
            variant="secondary"
            className="w-fit liquid-glass-inset border-violet-500/10 text-violet-400 bg-transparent rounded-xl"
          >
            {models.length} total
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-foreground/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">
                  Model Name
                </TableHead>
                <TableHead className="text-muted-foreground font-medium">
                  Date Joined
                </TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">
                  Total Revenue
                </TableHead>
                <TableHead className="text-center text-muted-foreground font-medium">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow
                  key={model.name}
                  className="border-foreground/[0.03] transition-colors duration-300 hover:bg-foreground/[0.02]"
                >
                  <TableCell className="font-medium text-foreground">
                    {model.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(model.dateJoined)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {formatCurrency(model.revenue)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={
                        model.status === "active"
                          ? "liquid-glass-inset border-emerald-400/10 bg-emerald-400/5 text-emerald-400 rounded-xl"
                          : "liquid-glass-inset border-foreground/5 bg-transparent text-muted-foreground rounded-xl"
                      }
                    >
                      {model.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer with glass inset divider */}
        <div className="border-t border-foreground/5 px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Total Commission (12%)
            </span>
            <span className="text-lg font-bold text-emerald-400">
              {formatCurrency(totalRevenue * 0.12)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

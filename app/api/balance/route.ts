import { NextResponse } from "next/server"

export async function GET() {
  const platforms = ["Chaturbate", "StripChat", "BongaCams", "MyFreeCams"]
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const weeklyEarnings = weekDays.map((day) => ({ day, amount: Math.round((Math.random() * 400 + 100) * 100) / 100 }))
  const totalGross = weeklyEarnings.reduce((sum, d) => sum + d.amount, 0)
  return NextResponse.json({
    totalGross: Math.round(totalGross * 100) / 100,
    modelShare: Math.round(totalGross * 0.7 * 100) / 100,
    recruiterShare: Math.round(totalGross * 0.1 * 100) / 100,
    weeklyEarnings,
    platformBreakdown: platforms.map((name) => ({ name, amount: Math.round((Math.random() * 800 + 200) * 100) / 100 })),
  })
}

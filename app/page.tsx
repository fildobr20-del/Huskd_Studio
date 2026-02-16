import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Support } from "@/components/landing/support"
import { Stats } from "@/components/landing/stats"
import { Steps } from "@/components/landing/steps"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Global background texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <Navbar />
      <Hero />
      <Features />
      <Support />
      <Stats />
      <Steps />
      <CTA />
      <Footer />
    </main>
  )
}

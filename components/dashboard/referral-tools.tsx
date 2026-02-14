"use client"

import { useState } from "react"
import { Copy, Download, Check, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const REFERRAL_CODE = "CAM-8821"
const EMBED_SNIPPET = `<a href="https://huskdlabel.com/join?ref=${REFERRAL_CODE}"
  style="display:inline-block;padding:12px 24px;
  background:linear-gradient(135deg,#8B5CF6,#3B82F6);
  color:#fff;border-radius:12px;
  text-decoration:none;font-family:sans-serif;">
  Join Husk'd Label
</a>`

export function ReferralTools() {
  const [copied, setCopied] = useState<"code" | "embed" | null>(null)

  const handleCopy = async (text: string, type: "code" | "embed") => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl liquid-glass liquid-shimmer h-full flex flex-col">
      {/* Top specular edge */}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-foreground/8 to-transparent"
      />
      {/* Internal refraction */}
      <div
        aria-hidden="true"
        className="absolute -right-16 top-0 h-36 w-36 rounded-full bg-violet-500/[0.06] blur-3xl"
      />

      <div className="relative z-10 p-5 flex flex-col h-full">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground">
            Your Recruitment Code
          </h2>
          <p className="text-sm text-muted-foreground">
            Share to earn commissions on every recruited model
          </p>
        </div>

        {/* Code display in inset glass */}
        <div className="mb-5 liquid-glass-inset rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Referral Code
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-violet-400">
              {REFERRAL_CODE}
            </p>
          </div>
          <div className="h-10 w-px bg-gradient-to-b from-transparent via-foreground/10 to-transparent" />
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Rate
            </p>
            <p className="text-lg font-bold text-emerald-400">12%</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => handleCopy(REFERRAL_CODE, "code")}
            className="flex-1 relative overflow-hidden bg-gradient-to-r from-violet-600 to-blue-600 text-primary-foreground hover:from-violet-500 hover:to-blue-500 border-0 shadow-lg shadow-violet-500/20 transition-all duration-300 rounded-2xl h-10"
          >
            {copied === "code" ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied === "code" ? "Copied!" : "Copy Code"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 liquid-glass text-secondary-foreground hover:text-foreground bg-transparent border-foreground/10 hover:border-foreground/15 transition-all duration-300 rounded-2xl h-10"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Banner
          </Button>
        </div>

        {/* Embed code in glass inset */}
        <div className="mt-auto">
          <div className="mb-2 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Embed Code
            </p>
          </div>
          <div className="group relative">
            <pre className="overflow-x-auto liquid-glass-inset rounded-2xl p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              <code>{EMBED_SNIPPET}</code>
            </pre>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCopy(EMBED_SNIPPET, "embed")}
              className="absolute right-2 top-2 h-7 liquid-glass px-2 text-xs text-muted-foreground opacity-0 transition-all duration-300 hover:text-foreground group-hover:opacity-100 border-none shadow-none rounded-xl"
            >
              {copied === "embed" ? (
                <Check className="mr-1 h-3 w-3" />
              ) : (
                <Copy className="mr-1 h-3 w-3" />
              )}
              {copied === "embed" ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

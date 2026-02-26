// ============================================================
// Husk Label — XModels Content Script v1.1
// ============================================================
// 1 единица = $1 USD

;(function () {
  const PLATFORM = "xmodels"

  function getUsername() {
    const selectors = [
      ".model-name", ".account-name", ".profile-name", ".username",
      '[class*="username"]', '[class*="model-name"]', "#username", ".user-login",
    ]
    const el = window.HuskLabel.findElement(selectors)
    if (el?.textContent?.trim()) return el.textContent.trim().replace("@", "")
    const m = location.pathname.match(/\/(?:model|profile|account|user)\/([a-zA-Z0-9_-]+)/)
    if (m) return m[1]
    return null
  }

  function getMonthlyEarnings() {
    const selectors = [
      '[class*="earning"]', '[class*="income"]', '[class*="balance"]',
      '[class*="revenue"]', ".monthly-total", ".current-month",
      ".earnings-total", ".income-total",
    ]
    const el = window.HuskLabel.findElement(selectors)
    if (el?.textContent) {
      const amount = window.HuskLabel.parseAmount(el.textContent)
      if (amount > 0) return Math.round(amount * 100) / 100
    }
    return window.HuskLabel.findAmountNearKeyword([
      "this month", "current month", "monthly earnings", "total earnings",
      "balance", "revenue", "earned", "заработок"
    ])
  }

  function collect() {
    if (!location.hostname.includes("xmodels.com")) return
    const username = getUsername()
    const amount = getMonthlyEarnings()
    if (username && amount > 0) {
      window.HuskLabel.sendStats(PLATFORM, username, amount)
    } else {
      console.log(`[HuskLabel] XModels: username=${username}, amount=${amount}`)
    }
  }

  window.HuskLabel.collect = collect
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(collect, 2500))
  } else {
    setTimeout(collect, 2500)
  }
  setTimeout(collect, 6000)
})()

// ============================================================
// Husk Label — Fansly v1.0
// Страница: fansly.com/account/earnings или /creator/payments
// Собирает заработок модели за текущий месяц.
// 1 единица Fansly = $1 USD
// ============================================================

;(function () {
  const PLATFORM = "fansly"

  if (window.__huskFanslyInstalled) return
  window.__huskFanslyInstalled = true

  // ---- Получаем username залогиненной модели ----
  function getUsername() {
    // 1. Из URL: fansly.com/@username
    const urlMatch = location.pathname.match(/^\/@?([A-Za-z0-9_]{3,40})/)
    if (urlMatch) return urlMatch[1].toLowerCase()

    // 2. Из DOM
    const selectors = [
      "[class*='username']", "[class*='UserName']",
      "[class*='creator-name']", "[class*='CreatorName']",
      "[class*='account-name']", "[class*='profile-name']",
      "nav [class*='name']", "header [class*='name']",
      "[data-username]", "[data-handle]",
    ]
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel)
        if (el) {
          const t = (el.dataset.username || el.dataset.handle || el.textContent || "")
            .trim().replace(/^@/, "").toLowerCase()
          if (/^[a-z][a-z0-9_]{2,39}$/.test(t)) return t
        }
      } catch(e) {}
    }

    // 3. Из meta-тегов
    const metaEl = document.querySelector('meta[property="profile:username"], meta[name="username"]')
    if (metaEl) return metaEl.getAttribute("content")?.replace(/^@/, "").toLowerCase() || null

    return null
  }

  // ---- Получаем заработок за текущий месяц через API ----
  async function tryFanslyApi() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01T00:00:00Z`
    const lastDay  = new Date(year, month, 1).toISOString()

    const endpoints = [
      `/api/v1/account/earnings?from=${firstDay}&to=${lastDay}`,
      `/api/v1/creator/earnings?start=${firstDay}&end=${lastDay}`,
      `/api/v1/account/payments`,
      `/api/v1/creator/stats`,
      `/api/v1/account/stats`,
    ]

    for (const endpoint of endpoints) {
      try {
        const resp = await fetch(`https://apiv3.fansly.com${endpoint}`, {
          credentials: "include",
          headers: { "User-Agent": navigator.userAgent }
        })
        if (!resp.ok) continue
        const data = await resp.json()
        console.log(`[HuskLabel] Fansly API ${endpoint}: ${JSON.stringify(data).slice(0, 200)}`)

        const amount = extractAmount(data)
        if (amount > 0) return amount
      } catch(e) {}
    }
    return 0
  }

  // ---- Извлекаем сумму из ответа API ----
  function extractAmount(obj, depth = 0) {
    if (!obj || depth > 5) return 0
    if (typeof obj === "number") return obj

    if (typeof obj === "object") {
      // Ищем ключ с суммой
      const amountKeys = ["total", "amount", "earnings", "net", "revenue", "balance", "gross"]
      for (const key of Object.keys(obj)) {
        const kl = key.toLowerCase()
        if (amountKeys.some(a => kl.includes(a))) {
          const val = Number(obj[key])
          if (val > 0) return Math.round(val * 100) / 100
        }
      }
      // Рекурсия
      for (const val of Object.values(obj)) {
        const found = extractAmount(val, depth + 1)
        if (found > 0) return found
      }
    }
    if (Array.isArray(obj)) {
      let sum = 0
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      for (const item of obj) {
        const dateStr = String(item.date || item.created_at || item.timestamp || "")
        if (dateStr && !dateStr.startsWith(monthKey)) continue
        const amt = Number(item.amount || item.net || item.total || 0)
        if (amt > 0) sum += amt
      }
      if (sum > 0) return Math.round(sum * 100) / 100
    }
    return 0
  }

  // ---- Читаем заработок из DOM страницы ----
  function readFromPage() {
    return window.HuskLabel.findAmountNearKeyword([
      "this month", "current month", "monthly earnings", "total earnings",
      "net earnings", "total revenue", "earned this month",
      "monthly payout", "month to date",
    ])
  }

  // ---- Перехватываем XHR/fetch через interceptor ----
  window.addEventListener("message", (event) => {
    if (event.data?.type !== "__HUSK_INTERCEPTED__") return
    const { url, data } = event.data
    if (!/earning|payment|payout|subscription|revenue|stat/i.test(url)) return

    const amount = extractAmount(data)
    if (amount <= 0) return

    const username = getUsername()
    if (!username) {
      console.log("[HuskLabel] Fansly: сумма найдена но username не определён")
      return
    }

    console.log(`[HuskLabel] Fansly intercepted: ${username} → $${amount}`)
    window.HuskLabel.sendStats(PLATFORM, username, amount)
  })

  // ---- Основная функция сбора ----
  async function collect() {
    if (!location.hostname.includes("fansly.com")) return
    // Запускаемся только на страницах с финансовой информацией
    const path = location.pathname.toLowerCase()
    if (!path.includes("earn") && !path.includes("payment") &&
        !path.includes("account") && !path.includes("creator") &&
        !path.includes("payout") && !path.includes("stat")) return

    console.log("[HuskLabel] Fansly: начало сбора...")

    const username = getUsername()
    if (!username) {
      console.log("[HuskLabel] Fansly: username не найден")
      return
    }

    // Пробуем API
    let amount = await tryFanslyApi()

    // Если API не сработало — читаем со страницы
    if (amount <= 0) {
      amount = readFromPage()
    }

    if (amount > 0) {
      console.log(`[HuskLabel] Fansly ✓ ${username}: $${amount}`)
      window.HuskLabel.sendStats(PLATFORM, username, amount)
    } else {
      console.log(`[HuskLabel] Fansly: данные не найдены (username=${username})`)
    }
  }

  window.HuskLabel.collect = collect

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(collect, 3000))
  } else {
    setTimeout(collect, 3000)
  }
  // Повторный запуск на случай динамической загрузки данных
  setTimeout(collect, 8000)
})()

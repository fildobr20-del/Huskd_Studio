// ============================================================
// Husk Label — Fansly v2.0
// Платформа: fansly.com
// 1 единица Fansly = $1 USD
//
// Стратегии:
//  1. Interceptor — ловим XHR/fetch с данными о доходах
//  2. Fansly API — прямой fetch на эндпоинты доходов
//  3. DOM — ищем таблицу моделей (студийный кабинет)
//  4. DOM — fallback одиночная модель (username + сумма)
// ============================================================

;(function () {
  const PLATFORM = "fansly"

  if (window.__huskFanslyInstalled) return
  window.__huskFanslyInstalled = true

  // ---- Normalize username (same as API) ----
  function normalizeUsername(s) {
    return s.replace(/^@+/, "").toLowerCase().trim().replace(/[\s\-]+/g, "_")
  }

  // ---- Извлекаем сумму из вложенного объекта ----
  function extractAmount(obj, depth = 0) {
    if (!obj || depth > 5) return 0
    if (typeof obj === "number" && obj > 0) return Math.round(obj * 100) / 100

    if (typeof obj === "object" && !Array.isArray(obj)) {
      const amountKeys = ["total", "amount", "earnings", "net", "revenue", "balance", "gross",
                          "income", "payout", "earned", "credit"]
      for (const key of Object.keys(obj)) {
        const kl = key.toLowerCase()
        if (amountKeys.some(a => kl.includes(a)) && !["date","time","id","type","currency"].some(x => kl.includes(x))) {
          const val = Number(obj[key])
          if (val > 0) return Math.round(val * 100) / 100
        }
      }
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
        if (typeof item !== "object" || !item) continue
        const dateStr = String(item.date || item.created_at || item.timestamp || "")
        if (dateStr && !dateStr.startsWith(monthKey)) continue
        const amt = Number(item.amount || item.net || item.total || 0)
        if (amt > 0) sum += amt
      }
      if (sum > 0) return Math.round(sum * 100) / 100
    }
    return 0
  }

  // ---- Извлекаем [{username, amount}] из JSON (для студийного кабинета) ----
  function extractEntries(data) {
    const entries = []
    if (!data || typeof data !== "object") return entries

    function scan(obj, depth = 0, inArray = false) {
      if (!obj || depth > 8 || typeof obj !== "object") return
      if (Array.isArray(obj)) { obj.forEach(i => scan(i, depth + 1, true)); return }

      const keys = Object.keys(obj)
      const nameKey = keys.find(k => {
        const kl = k.toLowerCase()
        return ["username","name","login","nickname","creator","performer","model","slug","handle","screenname"]
          .some(x => kl === x || kl.includes(x))
      })
      const amountKey = keys.find(k => {
        const kl = k.toLowerCase()
        return ["earning","amount","total","revenue","income","balance","credit","payout","net","gross"]
          .some(x => kl.includes(x)) &&
          !["date","time","id","per_","type","currency"].some(x => kl.includes(x))
      })

      if (nameKey && amountKey && inArray) {
        const username = normalizeUsername(String(obj[nameKey]))
        const raw = Number(obj[amountKey])
        if (username.length > 1 && raw > 0 &&
            !/^\d+$/.test(username) &&
            /^[a-z][a-z0-9_]{1,39}$/.test(username)) {
          const amount = Math.round(raw * 100) / 100
          if (!entries.find(e => e.username === username)) {
            entries.push({ username, amount })
          }
        }
      }
      keys.forEach(k => scan(obj[k], depth + 1, false))
    }
    scan(data, 0, false)
    return entries
  }

  // ---- Получаем username залогиненной модели ----
  function getUsername() {
    // 1. Из URL: fansly.com/@username
    const urlMatch = location.pathname.match(/^\/@?([A-Za-z0-9_]{3,40})/)
    if (urlMatch) return normalizeUsername(urlMatch[1])

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
          const t = (el.dataset.username || el.dataset.handle || el.textContent || "").trim()
          const norm = normalizeUsername(t)
          if (/^[a-z][a-z0-9_]{2,39}$/.test(norm)) return norm
        }
      } catch(e) {}
    }

    // 3. Из meta-тегов
    const metaEl = document.querySelector('meta[property="profile:username"], meta[name="username"]')
    if (metaEl) {
      const val = metaEl.getAttribute("content")
      if (val) return normalizeUsername(val)
    }

    return null
  }

  // ---- Interceptor: ловим XHR ответы с данными о доходах ----
  window.addEventListener("message", (event) => {
    if (event.data?.type !== "__HUSK_INTERCEPTED__") return
    const { url, data } = event.data
    if (!/earning|payment|payout|subscription|revenue|stat|income|balance|credit/i.test(url)) return

    console.log(`[HuskLabel] Fansly intercepted: ${url.slice(0, 120)}`)

    // Пробуем извлечь как массив моделей (студия)
    const entries = extractEntries(data)
    if (entries.length > 0) {
      console.log(`[HuskLabel] Fansly intercepted batch: ${entries.length} моделей`)
      window.HuskLabel.sendBatchStats(PLATFORM, entries)
      return
    }

    // Иначе — одиночная модель
    const amount = extractAmount(data)
    if (amount <= 0) return

    const username = getUsername()
    if (!username) {
      console.log("[HuskLabel] Fansly: сумма найдена но username не определён")
      return
    }

    console.log(`[HuskLabel] Fansly intercepted single: ${username} → $${amount}`)
    window.HuskLabel.sendStats(PLATFORM, username, amount)
  })

  // ---- Стратегия 1: performance entries → re-fetch XHR ----
  async function collectViaPerformance() {
    const base = location.origin
    const resources = performance.getEntriesByType("resource")

    const candidates = [...new Set(
      resources.map(r => r.name).filter(u => {
        const l = u.toLowerCase()
        return (l.startsWith(base.toLowerCase()) || l.includes("apiv3.fansly.com")) &&
          (l.includes("earn") || l.includes("payment") || l.includes("stat") ||
           l.includes("balance") || l.includes("payout") || l.includes("income") ||
           l.includes("revenue") || l.includes("creator") || l.includes("subscription")) &&
          !l.includes("analytics") && !l.includes("google") && !l.includes("collect")
      })
    )]

    console.log(`[HuskLabel] Fansly: ${candidates.length} XHR кандидатов`)

    let allEntries = []
    let singleAmount = 0

    for (const url of candidates) {
      try {
        const r = await fetch(url, { credentials: "include" })
        if (!r.ok) continue
        const ct = r.headers.get("content-type") || ""
        if (!ct.includes("json")) continue
        const data = await r.json()
        console.log(`[HuskLabel] Fansly XHR: ${url.split("?")[0].split("/").pop()}: ${JSON.stringify(data).slice(0, 200)}`)

        // Пробуем batch
        const entries = extractEntries(data)
        if (entries.length > 0) allEntries.push(...entries)

        // Пробуем single
        const amt = extractAmount(data)
        if (amt > singleAmount) singleAmount = amt
      } catch (e) {}
    }

    // Batch
    const unique = []
    for (const e of allEntries) {
      if (!unique.find(u => u.username === e.username)) unique.push(e)
    }
    if (unique.length > 0) {
      window.HuskLabel.sendBatchStats(PLATFORM, unique)
      return true
    }

    // Single
    if (singleAmount > 0) {
      const username = getUsername()
      if (username) {
        window.HuskLabel.sendStats(PLATFORM, username, singleAmount)
        return true
      }
    }

    return false
  }

  // ---- Стратегия 2: прямой Fansly API ----
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
      `/api/v1/account/wallet/earnings`,
      `/api/v1/account/wallet/balance`,
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

        // Batch (студия)
        const entries = extractEntries(data)
        if (entries.length > 0) return { type: "batch", entries }

        // Single
        const amount = extractAmount(data)
        if (amount > 0) return { type: "single", amount }
      } catch(e) {}
    }
    return null
  }

  // ---- Стратегия 3: DOM таблица (студия) ----
  async function readStatsTable() {
    const entries = []
    const rows = Array.from(document.querySelectorAll(
      "table tr, [class*='model-row'], [class*='ModelRow'], [class*='creator-row'], " +
      "[class*='CreatorRow'], [class*='stat-row']"
    ))

    console.log(`[HuskLabel] Fansly DOM: ${rows.length} строк`)

    for (const row of rows) {
      const rowText = (row.textContent || "").trim()
      if (!rowText) continue
      if (/^(model|creator|name|username|total|earned|rank|#)/i.test(rowText)) continue
      if (/total|итого|всего/i.test(rowText.slice(0, 20))) continue

      const cells = Array.from(row.querySelectorAll("td, [class*='cell'], [class*='Cell']"))
      if (cells.length < 2) continue

      let username = null, usernameIdx = -1
      for (let i = 0; i < cells.length; i++) {
        const t = cells[i].textContent.trim()
        const tNorm = normalizeUsername(t)
        if (/^[a-zA-Z][a-zA-Z0-9_ .-]{1,39}$/.test(t) && !/^\d+$/.test(t)) {
          const skip = ["total","model","creator","earned","earnings","name","rank","income","revenue","balance","date","period"]
          if (!skip.includes(tNorm)) {
            username = tNorm
            usernameIdx = i
            break
          }
        }
      }

      if (!username) continue

      let maxAmount = 0
      for (let i = usernameIdx + 1; i < cells.length; i++) {
        const n = parseFloat(cells[i].textContent.replace(/[^0-9.]/g, ""))
        if (!isNaN(n) && n > maxAmount) maxAmount = n
      }

      if (maxAmount > 0 && !entries.find(e => e.username === username)) {
        const amount = Math.round(maxAmount * 100) / 100
        entries.push({ username, amount })
        console.log(`[HuskLabel] Fansly DOM ✓ ${username}: $${amount}`)
      }
    }

    return entries
  }

  // ---- Стратегия 4: fallback одиночная модель ----
  function readSingleModel() {
    const username = getUsername()
    if (!username) return []

    let amount = window.HuskLabel.findAmountNearKeyword([
      "this month", "current month", "monthly earnings", "total earnings",
      "net earnings", "total revenue", "earned this month",
      "monthly payout", "month to date", "balance",
    ])

    if (amount <= 0) {
      const selectors = [
        '[class*="earning"]', '[class*="income"]', '[class*="balance"]',
        '[class*="revenue"]', ".monthly-total", ".current-month",
        ".earnings-total", ".income-total",
      ]
      const el = window.HuskLabel.findElement(selectors)
      if (el?.textContent) {
        amount = window.HuskLabel.parseAmount(el.textContent)
      }
    }

    if (amount > 0) {
      amount = Math.round(amount * 100) / 100
      console.log(`[HuskLabel] Fansly single ✓ ${username}: $${amount}`)
      return [{ username, amount }]
    }

    return []
  }

  // ---- Главная функция ----
  async function collect() {
    if (!location.hostname.includes("fansly.com")) return
    console.log(`[HuskLabel] Fansly v2.0 — ${location.href}`)

    // Стратегия 1: XHR из performance entries
    const perfOk = await collectViaPerformance()
    if (perfOk) return

    // Стратегия 2: Fansly API
    const apiResult = await tryFanslyApi()
    if (apiResult) {
      if (apiResult.type === "batch") {
        window.HuskLabel.sendBatchStats(PLATFORM, apiResult.entries)
        return
      }
      if (apiResult.type === "single") {
        const username = getUsername()
        if (username) {
          window.HuskLabel.sendStats(PLATFORM, username, apiResult.amount)
          return
        }
      }
    }

    // Стратегия 3: DOM таблица (студия)
    const tableEntries = await readStatsTable()
    if (tableEntries.length > 0) {
      window.HuskLabel.sendBatchStats(PLATFORM, tableEntries)
      return
    }

    // Стратегия 4: одиночная модель
    const singleEntries = readSingleModel()
    if (singleEntries.length > 0) {
      window.HuskLabel.sendBatchStats(PLATFORM, singleEntries)
      return
    }

    console.warn("[HuskLabel] Fansly: данные не найдены. Откройте страницу с заработком/статистикой")
  }

  window.HuskLabel.collect = collect

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(collect, 3000))
  } else {
    setTimeout(collect, 3000)
  }
  setTimeout(collect, 8000)
})()

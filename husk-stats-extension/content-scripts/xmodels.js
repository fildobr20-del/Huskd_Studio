// ============================================================
// Husk Label — XModels v2.0
// Платформа: xmodels.com (студийный кабинет)
// 1 единица XModels = $1 USD
//
// Стратегии:
//  1. Interceptor — ловим XHR/fetch с данными моделей
//  2. DOM — читаем таблицу со статистикой моделей
//  3. DOM — fallback: ищем username + заработок по ключевым словам
// ============================================================

;(function () {
  const PLATFORM = "xmodels"

  if (window.__huskXModelsInstalled) return
  window.__huskXModelsInstalled = true

  // ---- Normalize username (same as API) ----
  function normalize(s) {
    return s.replace(/^@+/, "").toLowerCase().trim().replace(/[\s\-]+/g, "_")
  }

  // ---- Interceptor: ловим XHR ответы с данными моделей ----
  window.addEventListener("message", (event) => {
    if (event.data?.type !== "__HUSK_INTERCEPTED__") return
    const { url, data } = event.data
    if (!/model|earn|stat|balance|payment|payout|income|revenue|credit/i.test(url)) return

    console.log(`[HuskLabel] XModels intercepted: ${url.slice(0, 120)}`)
    const entries = extractEntries(data)
    if (entries.length > 0) {
      console.log(`[HuskLabel] XModels intercepted: ${entries.length} моделей`)
      window.HuskLabel.sendBatchStats(PLATFORM, entries)
    }
  })

  // ---- Извлекаем [{username, amount}] из JSON ответа ----
  function extractEntries(data) {
    const entries = []
    if (!data || typeof data !== "object") return entries

    function scan(obj, depth = 0, inArray = false) {
      if (!obj || depth > 8 || typeof obj !== "object") return
      if (Array.isArray(obj)) { obj.forEach(i => scan(i, depth + 1, true)); return }

      const keys = Object.keys(obj)
      const nameKey = keys.find(k => {
        const kl = k.toLowerCase()
        return ["username","name","login","nickname","model","performer","slug","screenname","handle"]
          .some(x => kl === x || kl.includes(x))
      })
      const amountKey = keys.find(k => {
        const kl = k.toLowerCase()
        return ["earning","amount","total","revenue","income","balance","credit","payout","net"]
          .some(x => kl.includes(x)) &&
          !["date","time","id","per_","type","currency"].some(x => kl.includes(x))
      })

      if (nameKey && amountKey && inArray) {
        const username = normalize(String(obj[nameKey]))
        const raw = Number(obj[amountKey])
        if (username.length > 1 && raw > 0 &&
            !/^\d+$/.test(username) &&
            /^[a-z][a-z0-9_]{1,39}$/.test(username)) {
          const amount = Math.round(raw * 100) / 100  // XModels: 1 unit = $1
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

  // ---- Стратегия 1: performance entries → re-fetch XHR ----
  async function collectViaPerformance() {
    const base = location.origin
    const resources = performance.getEntriesByType("resource")

    const candidates = [...new Set(
      resources.map(r => r.name).filter(u => {
        const l = u.toLowerCase()
        return l.startsWith(base.toLowerCase()) &&
          (l.includes("model") || l.includes("earn") || l.includes("stat") ||
           l.includes("balance") || l.includes("payment") || l.includes("income") ||
           l.includes("credit") || l.includes("payout") || l.includes("revenue")) &&
          !l.includes("analytics") && !l.includes("google") && !l.includes("collect")
      })
    )]

    console.log(`[HuskLabel] XModels: ${candidates.length} XHR кандидатов`)

    let allEntries = []
    for (const url of candidates) {
      try {
        const r = await fetch(url, { credentials: "include" })
        if (!r.ok) continue
        const ct = r.headers.get("content-type") || ""
        if (!ct.includes("json")) continue
        const data = await r.json()
        console.log(`[HuskLabel] XModels XHR: ${url.split("?")[0].split("/").pop()}: ${JSON.stringify(data).slice(0, 200)}`)
        allEntries.push(...extractEntries(data))
      } catch (e) {}
    }

    // Дедуплицируем
    const unique = []
    for (const e of allEntries) {
      if (!unique.find(u => u.username === e.username)) unique.push(e)
    }

    if (unique.length > 0) {
      window.HuskLabel.sendBatchStats(PLATFORM, unique)
      return true
    }
    return false
  }

  // ---- Стратегия 2: DOM таблица ----
  async function readStatsTable() {
    await new Promise(r => setTimeout(r, 1500))
    const entries = []

    const rows = Array.from(document.querySelectorAll(
      "table tr, [class*='model-row'], [class*='ModelRow'], [class*='stat-row'], " +
      "[class*='broadcaster-row'], [class*='BroadcasterRow']"
    ))

    console.log(`[HuskLabel] XModels DOM: ${rows.length} строк`)

    for (const row of rows) {
      const rowText = (row.textContent || "").trim()
      if (!rowText) continue
      if (/^(model|name|username|total|earned|rank|#)/i.test(rowText)) continue
      if (/total|итого|всего/i.test(rowText.slice(0, 20))) continue

      const cells = Array.from(row.querySelectorAll("td, [class*='cell'], [class*='Cell']"))
      if (cells.length < 2) continue

      let username = null, usernameIdx = -1
      for (let i = 0; i < cells.length; i++) {
        const t = cells[i].textContent.trim()
        const tNorm = normalize(t)
        if (/^[a-zA-Z][a-zA-Z0-9_ .-]{1,39}$/.test(t) && !/^\d+$/.test(t)) {
          const skip = ["total","model","earned","earnings","name","rank","income","revenue","balance","date","period"]
          if (!skip.includes(tNorm)) {
            username = tNorm
            usernameIdx = i
            break
          }
        }
      }

      if (!username) continue

      // Ищем максимальное число после имени
      let maxAmount = 0
      for (let i = usernameIdx + 1; i < cells.length; i++) {
        const n = parseFloat(cells[i].textContent.replace(/[^0-9.]/g, ""))
        if (!isNaN(n) && n > maxAmount) maxAmount = n
      }

      if (maxAmount > 0 && !entries.find(e => e.username === username)) {
        const amount = Math.round(maxAmount * 100) / 100
        entries.push({ username, amount })
        console.log(`[HuskLabel] XModels DOM ✓ ${username}: $${amount}`)
      }
    }

    return entries
  }

  // ---- Стратегия 3: одиночная модель (личный кабинет, не студия) ----
  function readSingleModel() {
    // Ищем username
    let username = null

    // Из URL
    const urlMatch = location.pathname.match(/\/(?:model|profile|account|user)\/([a-zA-Z0-9_-]+)/)
    if (urlMatch) username = normalize(urlMatch[1])

    // Из DOM
    if (!username) {
      const selectors = [
        ".model-name", ".account-name", ".profile-name", ".username",
        '[class*="username"]', '[class*="model-name"]', "#username", ".user-login",
        "[data-username]", "[data-handle]",
      ]
      for (const sel of selectors) {
        try {
          const el = document.querySelector(sel)
          if (el) {
            const t = (el.dataset.username || el.dataset.handle || el.textContent || "").trim()
            const norm = normalize(t)
            if (/^[a-z][a-z0-9_]{2,39}$/.test(norm)) {
              username = norm
              break
            }
          }
        } catch(e) {}
      }
    }

    if (!username) return []

    // Ищем заработок
    let amount = 0

    // Через findAmountNearKeyword
    amount = window.HuskLabel.findAmountNearKeyword([
      "this month", "current month", "monthly earnings", "total earnings",
      "balance", "revenue", "earned", "заработок", "доход", "баланс",
      "income", "payout",
    ])

    // Через DOM селекторы
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
      console.log(`[HuskLabel] XModels single ✓ ${username}: $${amount}`)
      return [{ username, amount }]
    }

    console.log(`[HuskLabel] XModels: username=${username}, amount=${amount}`)
    return []
  }

  // ---- Главная функция ----
  async function collect() {
    if (!location.hostname.includes("xmodels.com")) return
    console.log(`[HuskLabel] XModels v2.0 — ${location.href}`)

    // Стратегия 1: XHR из performance entries
    const perfOk = await collectViaPerformance()
    if (perfOk) return

    // Стратегия 2: DOM таблица (студия с несколькими моделями)
    const tableEntries = await readStatsTable()
    if (tableEntries.length > 0) {
      window.HuskLabel.sendBatchStats(PLATFORM, tableEntries)
      return
    }

    // Стратегия 3: одиночная модель
    const singleEntries = readSingleModel()
    if (singleEntries.length > 0) {
      window.HuskLabel.sendBatchStats(PLATFORM, singleEntries)
      return
    }

    console.warn("[HuskLabel] XModels: данные не найдены. Откройте страницу с заработком/статистикой")
  }

  window.HuskLabel.collect = collect
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(collect, 2500))
  } else {
    setTimeout(collect, 2500)
  }
  setTimeout(collect, 7000)
})()

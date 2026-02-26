// ============================================================
// Husk Label — SkyPrivate v1.7
// Парсит ТЕКУЩИЙ МЕСЯЦ из списка транзакций/статистики.
// ВАЖНО: SkyPrivate берёт 33% комиссии → модель получает 67%.
// Все суммы умножаются на 0.67 перед отправкой в админку.
// ============================================================

;(function () {
  const PLATFORM = "skyprivate"
  const COMMISSION = 0.67   // модель получает 67% (33% — комиссия SkyPrivate)

  if (window.__huskSkyprivateInstalled) return
  window.__huskSkyprivateInstalled = true

  // Перехват API
  window.addEventListener("message", (event) => {
    if (event.data?.type !== "__HUSK_INTERCEPTED__") return
    const { url, data } = event.data
    const entries = parseSkyprivateData(data)
    if (entries.length > 0) {
      console.log(`[HuskLabel] SkyPrivate intercepted ${entries.length} entries`)
      window.HuskLabel.sendBatchStats(PLATFORM, entries)
    }
  })

  function parseSkyprivateData(obj, depth = 0) {
    const entries = []
    if (!obj || depth > 6) return entries
    if (Array.isArray(obj)) {
      // Суммируем по username за текущий месяц
      const totals = {}
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

      obj.forEach(item => {
        if (typeof item !== "object") return
        const keys = Object.keys(item)
        const fromKey = keys.find(k => ["from","username","name","model","performer","caller","client"].some(x => k.toLowerCase().includes(x)))
        const amtKey  = keys.find(k => ["amount","price","total","usd","cost","payment","earning"].some(x => k.toLowerCase().includes(x)))
        const dateKey = keys.find(k => ["date","time","created","at"].some(x => k.toLowerCase().includes(x)))

        if (!fromKey || !amtKey) return

        const username = String(item[fromKey]).trim().toLowerCase()
        const amount = Number(item[amtKey])
        const dateStr = item[dateKey] ? String(item[dateKey]) : ""

        // Фильтруем только текущий месяц
        if (dateStr && !dateStr.startsWith(monthKey) && !dateStr.includes(`/${now.getMonth() + 1}/`)) return

        if (username && amount > 0) {
          totals[username] = (totals[username] || 0) + amount
        }
      })

      Object.entries(totals).forEach(([username, amount]) => {
        // Вычитаем 33% комиссии SkyPrivate — модель получает 67%
        const net = Math.round(amount * COMMISSION * 100) / 100
        entries.push({ username, amount: net })
      })
      return entries
    }

    if (typeof obj === "object") {
      Object.values(obj).forEach(v => {
        const sub = parseSkyprivateData(v, depth + 1)
        entries.push(...sub)
      })
    }
    return entries
  }

  // ---- Читаем транзакции со страницы ----
  function parseTransactionsFromPage() {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const totals = {}

    // Ищем список транзакций
    const rows = document.querySelectorAll(
      "[class*='transaction'], [class*='Transaction'], [class*='payment'], " +
      "li[class*='item'], tr, [class*='history'] > *"
    )

    rows.forEach(row => {
      const text = row.textContent || ""

      // Ищем имя отправителя (обычно "Received $X from Username")
      const receivedMatch = text.match(/[Rr]eceived\s+\$?([\d.]+)\s+from\s+([A-Za-z0-9_]+)/i)
      const fromMatch     = text.match(/from\s+([A-Za-z0-9_]{3,30})/i)
      const amountMatch   = text.match(/\$\s*([\d.,]+)/)

      // Проверяем что транзакция в текущем месяце
      const dateMatch = text.match(/(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2,4})/) ||
                        text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d+,?\s+\d{4}/i)
      let isCurrentMonth = true
      if (dateMatch) {
        // Если дата есть — проверяем месяц
        const dateStr = dateMatch[0]
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
          isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear
        }
      }

      if (!isCurrentMonth) return

      if (receivedMatch) {
        const amount = parseFloat(receivedMatch[1])
        const username = receivedMatch[2].toLowerCase()
        if (username && amount > 0) {
          totals[username] = (totals[username] || 0) + amount
        }
      } else if (fromMatch && amountMatch) {
        const username = fromMatch[1].toLowerCase()
        const amount = window.HuskLabel.parseAmount(amountMatch[1])
        if (username && amount > 0) {
          totals[username] = (totals[username] || 0) + amount
        }
      }
    })

    return Object.entries(totals).map(([username, amount]) => ({
      username,
      // Вычитаем 33% комиссии SkyPrivate — модель получает 67%
      amount: Math.round(amount * COMMISSION * 100) / 100
    }))
  }

  // ---- Прямые API вызовы ----
  async function tryDirectApi() {
    const base = location.origin
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, "0")

    const endpoints = [
      `${base}/api/transactions?month=${y}-${m}`,
      `${base}/api/earnings?from=${y}-${m}-01`,
      `${base}/api/v1/transactions`,
      `${base}/api/v1/earnings`,
      `${base}/api/stats`,
      `${base}/account/api/transactions`,
    ]

    for (const url of endpoints) {
      try {
        const resp = await fetch(url, { credentials: "include" })
        if (resp.ok) {
          const data = await resp.json()
          const entries = parseSkyprivateData(data)
          if (entries.length > 0) {
            console.log(`[HuskLabel] SkyPrivate API ${url}: ${entries.length} entries`)
            window.HuskLabel.sendBatchStats(PLATFORM, entries)
            return true
          }
        }
      } catch (e) {}
    }
    return false
  }

  // ---- Режим индивидуального аккаунта (не студийного) ----
  // Возвращает username залогиненной модели + её суммарный заработок за месяц
  function collectIndividual() {
    // Пробуем найти username самой модели
    const selectors = [
      "[class*='username']", "[class*='UserName']",
      "[class*='account-name']", "[class*='profile-name']",
      "nav [class*='user']", "header [class*='user']",
      ".profile-username", "#username", ".my-name",
    ]
    let username = null
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel)
        if (el) {
          const t = el.textContent.trim().replace(/^@/, "").toLowerCase()
          if (/^[a-z][a-z0-9_]{2,39}$/.test(t)) { username = t; break }
        }
      } catch(e) {}
    }
    // Из URL: skyprivate.com/user/myname/...
    if (!username) {
      const m = location.pathname.match(/\/user\/([a-zA-Z0-9_]{3,40})/)
      if (m) username = m[1].toLowerCase()
    }
    if (!username) return null

    // Суммируем ВСЕ входящие транзакции за текущий месяц (независимо от отправителя)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear  = now.getFullYear()
    let total = 0

    const rows = document.querySelectorAll(
      "[class*='transaction'], [class*='Transaction'], [class*='payment'], " +
      "li[class*='item'], tr, [class*='history'] > *"
    )
    rows.forEach(row => {
      const text = row.textContent || ""
      const amountMatch = text.match(/\$\s*([\d.,]+)/)
      if (!amountMatch) return

      const dateMatch = text.match(/(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2,4})/) ||
                        text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d+,?\s+\d{4}/i)
      if (dateMatch) {
        const d = new Date(dateMatch[0])
        if (!isNaN(d.getTime()) && (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear)) return
      }

      const amount = window.HuskLabel.parseAmount(amountMatch[1])
      if (amount > 0) total += amount
    })

    // Также ищем итоговую цифру на странице
    if (total <= 0) {
      total = window.HuskLabel.findAmountNearKeyword([
        "this month", "current month", "monthly earnings", "total earned",
        "balance", "earnings this month", "earned"
      ])
    }

    if (total > 0) {
      const net = Math.round(total * COMMISSION * 100) / 100
      return { username, amount: net }
    }
    return null
  }

  async function collect() {
    if (!location.hostname.includes("skyprivate.com")) return
    console.log("[HuskLabel] SkyPrivate: начало сбора...")

    // Сначала пробуем API (работает и для студии, и для индивидуальных)
    const apiOk = await tryDirectApi()
    if (apiOk) return

    // Пробуем студийный режим (несколько моделей)
    const entries = parseTransactionsFromPage()
    if (entries.length > 0) {
      console.log(`[HuskLabel] SkyPrivate DOM (студия): ${entries.length} записей`)
      window.HuskLabel.sendBatchStats(PLATFORM, entries)
      return
    }

    // Если студийный режим не нашёл моделей — пробуем индивидуальный
    const individual = collectIndividual()
    if (individual) {
      console.log(`[HuskLabel] SkyPrivate DOM (individual): ${individual.username} → $${individual.amount}`)
      window.HuskLabel.sendStats(PLATFORM, individual.username, individual.amount)
    } else {
      console.log("[HuskLabel] SkyPrivate: данные за текущий месяц не найдены")
    }
  }

  window.HuskLabel.collect = collect

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(collect, 2000))
  } else {
    setTimeout(collect, 2000)
  }
})()

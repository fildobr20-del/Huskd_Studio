// ============================================================
// Husk Label — Chaturbate v1.6
// Прямой fetch на affiliates/stats с правильными параметрами
// stats_breakdown=sub_account__username (двойной _)
// ============================================================

;(function () {
  const PLATFORM = "chaturbate"
  const TOKEN_RATE = 0.05

  if (window.__huskChaturbateInstalled) return
  window.__huskChaturbateInstalled = true

  // Перехват API (на случай если страница сама что-то загружает)
  window.addEventListener("message", (event) => {
    if (event.data?.type !== "__HUSK_INTERCEPTED__") return
    const entries = []
    extractFromObj(event.data.data, entries)
    if (entries.length > 0) {
      console.log(`[HuskLabel] CB intercepted ${entries.length} entries`)
      window.HuskLabel.sendBatchStats(PLATFORM, entries)
    }
  })

  function extractFromObj(obj, out, depth = 0) {
    if (!obj || depth > 8 || typeof obj !== "object") return
    if (Array.isArray(obj)) { obj.forEach(i => extractFromObj(i, out, depth + 1)); return }
    const keys = Object.keys(obj)
    const nameKey = keys.find(k => ["username","name","login","performer","sub_account"].some(x => k.toLowerCase().includes(x)))
    const tokKey  = keys.find(k => ["token","earning","revenue","amount"].some(x => k.toLowerCase().includes(x)))
    if (nameKey && tokKey) {
      const username = String(obj[nameKey]).trim().toLowerCase()
      const raw = Number(obj[tokKey])
      if (username.length > 1 && raw > 0)
        out.push({ username, amount: Math.round(raw * TOKEN_RATE * 100) / 100 })
    }
    keys.forEach(k => extractFromObj(obj[k], out, depth + 1))
  }

  // ---- Парсинг HTML таблицы ----
  function parseHtmlTable(html) {
    const doc = new DOMParser().parseFromString(html, "text/html")
    const entries = []

    // Ищем таблицу с данными
    const tables = doc.querySelectorAll("table")
    for (const table of tables) {
      const rows = Array.from(table.querySelectorAll("tr"))
      if (rows.length < 2) continue

      // Определяем индексы колонок из заголовка
      const header = rows[0]
      const ths = Array.from(header.querySelectorAll("th, td")).map(el => el.textContent.trim().toLowerCase())

      let usernameIdx = ths.findIndex(t => t.includes("username") || t.includes("account") || t.includes("user"))
      let tokensIdx   = ths.findIndex(t => t.includes("token") || t.includes("earning") || t.includes("revenue"))

      if (usernameIdx === -1) usernameIdx = 0
      if (tokensIdx === -1) {
        // Берём последнюю числовую колонку
        tokensIdx = ths.length - 1
      }

      console.log(`[HuskLabel] CB table headers:`, ths, `| usernameIdx=${usernameIdx} tokensIdx=${tokensIdx}`)

      for (let i = 1; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll("td"))
        if (cells.length < 2) continue

        const username = cells[usernameIdx]?.textContent.trim().toLowerCase()
        if (!username || !username.match(/^[a-z][a-z0-9_]{1,29}$/i)) continue

        // Ищем максимальное число в строке (токены)
        let maxTokens = 0
        cells.forEach((cell, idx) => {
          if (idx === usernameIdx) return
          const n = parseFloat(cell.textContent.replace(/[^0-9.]/g, ""))
          if (n > maxTokens) maxTokens = n
        })

        if (maxTokens > 0) {
          const usd = Math.round(maxTokens * TOKEN_RATE * 100) / 100
          entries.push({ username, amount: usd })
          console.log(`[HuskLabel] CB: ${username} → ${maxTokens} tokens → $${usd}`)
        }
      }

      if (entries.length > 0) break // нашли данные
    }

    return entries
  }

  // ---- Основной сбор через прямой fetch ----
  async function collectAffiliateStats() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, "0")
    const monthStart = `${y}-${m}-01`
    // Последний день месяца
    const lastDay = new Date(y, now.getMonth() + 1, 0)
    const monthEnd = `${y}-${m}-${String(lastDay.getDate()).padStart(2, "0")}`
    const today = now.toISOString().split("T")[0]
    const base = location.origin // https://chaturbate.com

    // Правильный URL с двойным подчёркиванием в sub_account__username
    const url = `${base}/affiliates/stats/?stats_breakdown=sub_account__username&campaign=&search_criteria=1&period=0&date=${today}&start_date=${monthStart}&end_date=${monthEnd}`

    console.log(`[HuskLabel] CB: запрашиваем ${url}`)

    try {
      const resp = await fetch(url, {
        credentials: "include",
        headers: { "Accept": "text/html,application/xhtml+xml" }
      })

      if (!resp.ok) {
        console.log(`[HuskLabel] CB: ответ ${resp.status}`)
        return false
      }

      const html = await resp.text()
      const entries = parseHtmlTable(html)

      if (entries.length > 0) {
        console.log(`[HuskLabel] CB affiliates: ${entries.length} моделей`, entries)
        window.HuskLabel.sendBatchStats(PLATFORM, entries)
        return true
      } else {
        console.log("[HuskLabel] CB: таблица пустая или нет данных за текущий месяц")
        // Логируем кусок HTML для отладки
        const tableStart = html.indexOf("<table")
        if (tableStart >= 0) {
          console.log("[HuskLabel] CB HTML table:", html.substring(tableStart, tableStart + 500))
        }
        return false
      }
    } catch (e) {
      console.error("[HuskLabel] CB fetch error:", e)
      return false
    }
  }

  // ---- Сбор с текущей страницы если уже загружена таблица ----
  async function collectFromCurrentPage() {
    const entries = []
    const rows = document.querySelectorAll("table tr")

    if (rows.length < 2) return false

    const header = rows[0]
    const ths = Array.from(header.querySelectorAll("th, td")).map(el => el.textContent.trim().toLowerCase())
    let usernameIdx = ths.findIndex(t => t.includes("username") || t.includes("account"))
    let tokensIdx   = ths.findIndex(t => t.includes("token") || t.includes("earning"))
    if (usernameIdx === -1) usernameIdx = 0

    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll("td"))
      if (cells.length < 2) continue
      const username = cells[usernameIdx]?.textContent.trim().toLowerCase()
      if (!username?.match(/^[a-z][a-z0-9_]{1,29}$/i)) continue

      let maxN = 0
      cells.forEach((cell, idx) => {
        if (idx === usernameIdx) return
        const n = parseFloat(cell.textContent.replace(/[^0-9.]/g, ""))
        if (n > maxN) maxN = n
      })
      if (maxN > 0) entries.push({ username, amount: Math.round(maxN * TOKEN_RATE * 100) / 100 })
    }

    if (entries.length > 0) {
      console.log(`[HuskLabel] CB DOM: ${entries.length} записей`)
      window.HuskLabel.sendBatchStats(PLATFORM, entries)
      return true
    }
    return false
  }

  async function collect() {
    if (!location.hostname.includes("chaturbate.com")) return
    console.log("[HuskLabel] Chaturbate: начало сбора...")

    // Сначала пробуем текущую страницу (может уже есть таблица)
    const domOk = await collectFromCurrentPage()
    if (domOk) return

    // Иначе делаем прямой fetch с правильными параметрами
    const ok = await collectAffiliateStats()
    if (!ok) {
      console.log("[HuskLabel] CB: нет данных. Убедитесь что вы на chaturbate.com/affiliates/stats/")
    }
  }

  window.HuskLabel.collect = collect

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(collect, 2000))
  } else {
    setTimeout(collect, 2000)
  }
})()

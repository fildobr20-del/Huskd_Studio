// ============================================================
// Husk Label — Chaturbate v1.7
// Прямой fetch на affiliates/stats с правильными параметрами
// stats_breakdown=sub_account__username (двойной _)
// v1.7: ищем конкретную таблицу Sub Account|Tokens|Payout
//       фильтруем строку Total, читаем колонку Tokens точно
//       collectAffiliateStats() всегда первый (полный месяц = стабильный cumulative)
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

  // ---- Извлечь данные из конкретной таблицы Sub Account|Tokens|Payout ----
  // Работает и с DOMParser (из fetch) и с document
  function extractFromTables(root) {
    const entries = []
    const seen = new Set()
    const tables = root.querySelectorAll("table")

    for (const table of tables) {
      const rows = Array.from(table.querySelectorAll("tr"))
      if (rows.length < 2) continue

      const ths = Array.from(rows[0].querySelectorAll("th,td"))
        .map(el => el.textContent.trim().toLowerCase())

      // Ищем КОНКРЕТНО таблицу с Sub Account + Tokens
      // Ищем ТОЧНО таблицу "Sub Account | Tokens | Payout"
      // НЕ "Tokens Earned" (другая таблица с трафиком) — только "Tokens"
      const subAccIdx = ths.findIndex(t => t === "sub account")
      const tokensIdx = ths.findIndex(t => t === "tokens")

      if (subAccIdx === -1 || tokensIdx === -1) continue // не та таблица

      console.log(`[HuskLabel] CB: нашли таблицу [${ths.join("|")}] subAcc=${subAccIdx} tok=${tokensIdx}`)

      for (let i = 1; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll("td"))
        if (cells.length < 2) continue

        const username = cells[subAccIdx]?.textContent.trim().toLowerCase()
        // Пропускаем пустые, "total", невалидные имена
        if (!username || username === "total" || !/^[a-z][a-z0-9_]{1,29}$/.test(username)) continue
        if (seen.has(username)) continue
        seen.add(username)

        const tokens = parseInt((cells[tokensIdx]?.textContent.trim() || "0").replace(/[^0-9]/g, ""), 10)
        if (tokens > 0) {
          const usd = Math.round(tokens * TOKEN_RATE * 100) / 100
          entries.push({ username, amount: usd })
          console.log(`[HuskLabel] CB: ${username} → ${tokens} tk → $${usd}`)
        }
      }

      if (entries.length > 0) break // нашли нужную таблицу
    }

    return entries
  }

  // ---- Парсинг HTML таблицы (из fetch) ----
  function parseHtmlTable(html) {
    const doc = new DOMParser().parseFromString(html, "text/html")
    return extractFromTables(doc)
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

  async function collect() {
    if (!location.hostname.includes("chaturbate.com")) return
    console.log("[HuskLabel] Chaturbate v1.7: начало сбора...")

    // Всегда fetchим полный месяц для стабильного cumulative (нужно для snapshot-delta логики)
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

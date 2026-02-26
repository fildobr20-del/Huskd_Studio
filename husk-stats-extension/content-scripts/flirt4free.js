// ============================================================
// Husk Label — Flirt4Free v2.6
// Страница: studios.flirt4free.com/broadcasters/stats.php
//
// Стратегии:
//  1. Performance entries → XHR с per-model данными
//  2. DOM — читаем таблицу со статистикой моделей
//  3. DOM — читаем общий "326 CREDITS EARNED" + имя модели из URL/страницы
// ============================================================

;(function () {
  const PLATFORM = "flirt4free"
  const TOKEN_RATE = 0.03   // 1 credit Flirt4Free → $0.03

  window.__huskF4FListeners = window.__huskF4FListeners || false
  if (!window.__huskF4FListeners) {
    window.__huskF4FListeners = true
    window.addEventListener("message", (event) => {
      if (event.data?.type !== "__HUSK_INTERCEPTED__") return
      const { url, data } = event.data
      // Ловим XHR с данными о кредитах/моделях
      if (/credit|earn|model|broadcaster|performer|stat/i.test(url)) {
        const entries = extractF4FEntries(data, url)
        if (entries.length > 0) {
          console.log(`[HuskLabel] F4F intercepted ${entries.length} моделей из ${url}`)
          window.HuskLabel.sendBatchStats(PLATFORM, entries)
        }
      }
    })
  }

  // ---- Извлекаем [{username, amount}] из JSON ответа ----
  function extractF4FEntries(data, sourceUrl) {
    const entries = []
    if (!data || typeof data !== "object") return entries

    // Если это массив объектов с именем + кредитами
    // inArray=true: объект пришёл из массива → это запись модели (не студии)
    function scan(obj, depth = 0, inArray = false) {
      if (!obj || depth > 8 || typeof obj !== "object") return
      if (Array.isArray(obj)) { obj.forEach(i => scan(i, depth + 1, true)); return }

      const keys = Object.keys(obj)
      const nameKey = keys.find(k => {
        const kl = k.toLowerCase()
        return ["username","name","login","nickname","broadcaster","performer","model","slug"].some(x => kl === x || kl.includes(x))
      })
      const credKey = keys.find(k => {
        const kl = k.toLowerCase()
        return ["credit","token","earn","amount","total","revenue","income"].some(x => kl.includes(x)) &&
               !["date","time","id","per_"].some(x => kl.includes(x))
      })

      // Принимаем запись ТОЛЬКО если она найдена внутри массива (per-model строка).
      // Верхнеуровневая запись — это агрегат студии (huskies и т.п.) — пропускаем.
      if (nameKey && credKey && inArray) {
        const rawName = String(obj[nameKey]).trim()
        // Strip leading @ if present (F4F stores nicks as @username)
        const username = (rawName.startsWith("@") ? rawName.slice(1) : rawName).toLowerCase()
        const raw = Number(obj[credKey])
        if (username.length > 1 && raw > 0 &&
            !/^\d+$/.test(username) &&
            !username.includes(" ") &&
            /^[a-z][a-z0-9_]{1,39}$/.test(username)) {
          const usd = raw > 50 ? Math.round(raw * TOKEN_RATE * 100) / 100 : raw
          if (!entries.find(e => e.username === username)) {
            entries.push({ username, amount: usd })
          }
        }
      }
      keys.forEach(k => scan(obj[k], depth + 1, false))
    }
    scan(data, 0, false)
    return entries
  }

  // ---- Определяем имя аккаунта студии (чтобы исключить его из модельных записей) ----
  function getStudioOwnName() {
    // Только элементы которые ТОЧНО содержат имя аккаунта (не ссылки меню)
    const selectors = [
      "[class*='studio-name']", "[class*='studioName']",
      "[class*='account-name']", "[class*='accountName']",
      "[class*='studio-id']", "[class*='studioId']",
      ".studio_name", ".studioName", "#studioName",
      "[data-studio]", "[data-username]",
      "#studio-username", ".studio-username",
    ]
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel)
        if (el) {
          const t = el.textContent.trim().replace(/^@/, "").toLowerCase()
          if (/^[a-z][a-z0-9_]{2,39}$/.test(t)) {
            console.log(`[HuskLabel] F4F: студия найдена через "${sel}": "${t}"`)
            return t
          }
        }
      } catch(e) {}
    }

    // Из URL параметра
    const urlParam = new URLSearchParams(location.search).get("studio") ||
                     new URLSearchParams(location.search).get("account")
    if (urlParam) return urlParam.replace(/^@/, "").toLowerCase()

    // Из заголовка страницы: "Huskies - Studio Stats" → "huskies"
    const titleMatch = document.title.match(/^([A-Za-z][A-Za-z0-9_]{2,39})\s*[-|]/i)
    if (titleMatch) {
      const candidate = titleMatch[1].toLowerCase()
      if (!["studio","stats","dashboard","home","flirt","free","broadcasters"].includes(candidate)) {
        console.log(`[HuskLabel] F4F: студия из title: "${candidate}"`)
        return candidate
      }
    }

    // Дамп nav/header для отладки — видим что там есть
    console.log("[HuskLabel] F4F: студия не определена. Тексты nav/header:")
    document.querySelectorAll("nav *, header *").forEach(el => {
      const t = el.childNodes.length === 1 ? el.textContent.trim() : ""
      if (t.length > 2 && t.length < 40 && /^[a-z][a-z0-9_]{2,}$/i.test(t)) {
        console.log(`  [${el.tagName} .${[...el.classList].join(".")}]: "${t}"`)
      }
    })
    return null
  }

  // ---- Стратегия 1: performance entries → re-fetch XHR ----
  async function collectViaPerformance() {
    const base = location.origin
    const resources = performance.getEntriesByType("resource")

    // Ищем XHR запросы к stats-эндпоинтам
    const candidates = [...new Set(
      resources.map(r => r.name).filter(u => {
        const l = u.toLowerCase()
        return l.startsWith(base.toLowerCase()) &&
          (l.includes("credit") || l.includes("earn") || l.includes("model") ||
           l.includes("broadcaster") || l.includes("performer") || l.includes("stat") ||
           l.includes("premium") || l.includes("conversion")) &&
          !l.includes("collect") && !l.includes("analytics") && !l.includes("google")
      })
    )]

    console.log(`[HuskLabel] F4F: ${candidates.length} XHR кандидатов`)

    let allEntries = []
    for (const url of candidates) {
      try {
        const r = await fetch(url, { credentials: "include" })
        if (!r.ok) continue
        const data = await r.json()
        console.log(`[HuskLabel] F4F ${url.split("?")[0].split("/").pop()}: ${JSON.stringify(data).slice(0, 200)}`)
        const entries = extractF4FEntries(data, url)
        allEntries.push(...entries)
      } catch (e) {}
    }

    // Дедуплицируем + исключаем аккаунт студии
    const studioName = getStudioOwnName()
    if (studioName) console.log(`[HuskLabel] F4F: студия = "${studioName}" — будет исключена`)

    const unique = []
    for (const e of allEntries) {
      if (e.username === studioName) continue  // пропускаем аккаунт студии
      if (!unique.find(u => u.username === e.username)) unique.push(e)
    }

    if (unique.length > 0) {
      window.HuskLabel.sendBatchStats(PLATFORM, unique)
      return true
    }
    return false
  }

  // ---- Стратегия 2: DOM таблица со статистикой ----
  async function readStatsTable() {
    await new Promise(r => setTimeout(r, 1500))
    const entries = []

    // Ищем строки таблицы с моделями
    const rows = Array.from(document.querySelectorAll(
      "table tr, [class*='broadcaster-row'], [class*='model-row'], [class*='stat-row'], " +
      "[class*='BroadcasterRow'], [class*='ModelRow']"
    ))

    console.log(`[HuskLabel] F4F DOM: ${rows.length} строк`)

    for (const row of rows) {
      const rowText = (row.textContent || "").trim()
      if (!rowText) continue
      // Пропускаем header строки
      if (/^(model|broadcaster|name|credits|earned|total|rank)/i.test(rowText)) continue

      const cells = Array.from(row.querySelectorAll("td, [class*='cell'], [class*='Cell']"))
      if (cells.length < 2) continue

      let username = null, usernameIdx = -1
      for (let i = 0; i < cells.length; i++) {
        const t = cells[i].textContent.trim()
        const tLow = t.toLowerCase().replace(/\s+/g, "_")
        if (/^[a-zA-Z][a-zA-Z0-9_ ]{1,39}$/.test(t) && !/^\d+$/.test(t)) {
          const skip = ["total","credits","earned","model","broadcaster","stats","rank","week","month","period","date"]
          // Reject week/date labels like "week_of_nov_29th", "dec_12th", etc.
          const isDateLabel = /^week_of_|^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)_/i.test(tLow) ||
                              /_\d{1,2}(st|nd|rd|th)$/.test(tLow)
          if (!skip.includes(tLow) && !isDateLabel) {
            // Strip leading @ if present
            const cleaned = t.startsWith("@") ? t.slice(1) : t
            username = cleaned.toLowerCase().replace(/\s+/g, "_")
            usernameIdx = i
            break
          }
        }
      }

      if (!username) continue

      // Ищем максимальное число после имени (общие кредиты)
      let maxCredits = 0
      for (let i = usernameIdx + 1; i < cells.length; i++) {
        const n = parseInt(cells[i].textContent.replace(/[^0-9]/g, ""), 10)
        if (!isNaN(n) && n > maxCredits) maxCredits = n
      }

      const studioName = getStudioOwnName()
      if (username === studioName) continue  // пропускаем студию

      if (maxCredits > 0 && !entries.find(e => e.username === username)) {
        const usd = Math.round(maxCredits * TOKEN_RATE * 100) / 100
        entries.push({ username, amount: usd })
        console.log(`[HuskLabel] F4F DOM ✓ ${username}: ${maxCredits} credits → $${usd}`)
      }
    }

    return entries
  }

  // ---- Стратегия 3: читаем общий "X CREDITS EARNED" + имя модели ----
  function readPageSummary() {
    const bodyText = document.body.textContent || ""

    // Ищем "326 CREDITS EARNED" или "326 credits"
    const creditsMatch = bodyText.match(/(\d[\d,]+)\s+credits?\s+earned/i) ||
                         bodyText.match(/earned[:\s]+(\d[\d,]+)\s+credits?/i)
    if (!creditsMatch) return []

    const credits = parseInt(creditsMatch[1].replace(/,/g, ""), 10)
    if (credits <= 0) return []

    // Пробуем получить username
    // 1. Из URL параметра
    const params = new URLSearchParams(location.search)
    let rawParam = params.get("broadcaster") || params.get("model") ||
                   params.get("username") || params.get("nick")
    // Strip leading @ if present (F4F URL params can have @username)
    let username = rawParam ? (rawParam.startsWith("@") ? rawParam.slice(1) : rawParam) : null

    // 2. Из URL пути
    if (!username) {
      const m = location.pathname.match(/\/([a-zA-Z0-9_]{3,40})\/stats|\/stats\/([a-zA-Z0-9_]{3,40})/)
      if (m) username = (m[1] || m[2]).toLowerCase()
    }

    // 3. Из DOM — ищем имя рядом с "TOP PERFORMER" или в заголовке
    if (!username) {
      const topPerformerMatch = bodyText.match(/([A-Za-z][A-Za-z0-9_ ]{1,39})\s*[-–]\s*TOP PERFORMER/i)
      if (topPerformerMatch) username = topPerformerMatch[1].trim().toLowerCase().replace(/\s+/g, "_")
    }

    // 4. Из DOM элементов
    if (!username) {
      const selectors = [
        "[class*='broadcaster-name']", "[class*='BroadcasterName']",
        "[class*='model-name']", "[class*='ModelName']",
        "[class*='username']", "[class*='userName']",
        "h1", "h2", ".name", "#name",
      ]
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        if (el) {
          const t = el.textContent.trim()
          // Accept plain alphanumeric usernames (no @, no pure digits, no leading @)
          if (/^[a-zA-Z][a-zA-Z0-9_]{2,39}$/.test(t) &&
              !t.startsWith("@") &&
              !/^\d+$/.test(t)) {
            username = t.toLowerCase()
            break
          }
          // Also accept names with spaces (like "Marble Sparks") from name-specific selectors
          if (sel.includes("name") &&
              /^[A-Za-z][A-Za-z0-9_ ]{2,39}$/.test(t) &&
              !t.startsWith("@")) {
            username = t.trim().toLowerCase().replace(/\s+/g, "_")
            break
          }
        }
      }
    }

    if (!username) {
      console.log(`[HuskLabel] F4F: нашли ${credits} credits но не определили username`)
      return []
    }

    const usd = Math.round(credits * TOKEN_RATE * 100) / 100
    console.log(`[HuskLabel] F4F summary: ${username} → ${credits} credits = $${usd}`)
    return [{ username, amount: usd }]
  }

  // ---- Главная функция ----
  async function collect() {
    if (!location.hostname.includes("flirt4free.com")) return
    console.log(`[HuskLabel] Flirt4Free v2.0 — ${location.href}`)

    // Стратегия 1: XHR из performance entries
    const perfOk = await collectViaPerformance()
    if (perfOk) return

    // Стратегия 2: DOM таблица
    const tableEntries = await readStatsTable()
    if (tableEntries.length > 0) {
      window.HuskLabel.sendBatchStats(PLATFORM, tableEntries)
      return
    }

    // Стратегия 3: общий итог со страницы
    const summaryEntries = readPageSummary()
    if (summaryEntries.length > 0) {
      window.HuskLabel.sendBatchStats(PLATFORM, summaryEntries)
      return
    }

    console.warn("[HuskLabel] F4F: данные не найдены. Откройте studios.flirt4free.com/broadcasters/stats.php")
  }

  window.HuskLabel.collect = collect
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(collect, 2500))
  } else {
    setTimeout(collect, 2500)
  }
})()

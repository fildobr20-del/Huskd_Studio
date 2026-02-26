// ============================================================
// Husk Label — StripChat v2.3
// Читаем таблицу /studio-earnings напрямую из DOM.
// Таблица: [rank] [Model_Name] [чаевые] [pvt] [c2c] [подгляды] [офлайн] [альбомы] [видео] [фан-кл]
// Имена моделей — текст ячеек (НЕ ссылки).
// ============================================================

;(function () {
  const PLATFORM = "stripchat"
  const TOKEN_RATE = 0.05

  // Interceptor на случай если DOM не сработает
  window.__huskUserMap      = window.__huskUserMap      || {}
  window.__huskUserEarnings = window.__huskUserEarnings || {}

  if (!window.__huskStripchatListeners) {
    window.__huskStripchatListeners = true
    window.addEventListener("message", (event) => {
      if (event.data?.type !== "__HUSK_INTERCEPTED__") return
      buildUserMap(event.data.data)
      const em = event.data.url?.match(/\/users\/(\d+)\/earnings/)
      if (em) {
        const amt = extractAmount(event.data.data)
        if (amt > 0) { window.__huskUserEarnings[em[1]] = amt; tryFlush() }
      }
    })
  }

  function buildUserMap(obj, depth = 0) {
    if (!obj || depth > 10 || typeof obj !== "object") return
    if (Array.isArray(obj)) { obj.forEach(i => buildUserMap(i, depth + 1)); return }
    const keys = Object.keys(obj)
    const idKey   = keys.find(k => ["id","userid","user_id"].includes(k.toLowerCase()))
    const nameKey = keys.find(k => ["username","login","slug"].includes(k.toLowerCase()))
    if (idKey && nameKey) {
      const id = String(obj[idKey]); const u = String(obj[nameKey]).trim().toLowerCase()
      if (id && u.length > 2 && /^[a-z0-9_]+$/.test(u) && !window.__huskUserMap[id]) {
        window.__huskUserMap[id] = u
        console.log(`[HuskLabel] SC map: ${id} → ${u}`)
      }
    }
    keys.forEach(k => buildUserMap(obj[k], depth + 1))
  }

  function tryFlush() {
    const out = []
    for (const [id, amt] of Object.entries(window.__huskUserEarnings)) {
      const u = window.__huskUserMap[id]
      if (u) { out.push({ username: u, amount: amt }); delete window.__huskUserEarnings[id] }
    }
    if (out.length) { console.log(`[HuskLabel] SC flush: ${JSON.stringify(out)}`); window.HuskLabel.sendBatchStats(PLATFORM, out) }
  }

  function extractAmount(data) {
    function findMax(obj, d = 0) {
      if (!obj || d > 6 || typeof obj !== "object") return 0
      if (Array.isArray(obj)) return Math.max(0, ...obj.map(i => findMax(i, d + 1)))
      let max = 0
      for (const [k, v] of Object.entries(obj)) {
        const kl = k.toLowerCase()
        if (["token","earn","credit","revenue","income","amount","usd"].some(x => kl.includes(x)) &&
            !["date","day","time","stamp","user","name","id"].some(x => kl.includes(x))) {
          const n = Number(v); if (n > max) max = n
        }
        if (typeof v === "object") { const s = findMax(v, d + 1); if (s > max) max = s }
      }
      return max
    }
    const raw = findMax(data); if (raw <= 0) return 0
    return (Number.isInteger(raw) && raw > 100) ? Math.round(raw * TOKEN_RATE * 100) / 100 : raw
  }

  // ================================================================
  // ГЛАВНАЯ СТРАТЕГИЯ: читаем DOM таблицу
  // Строка: [rank_number] [Model_Name_text] [num] [num] [num] ...
  // ================================================================
  async function readTable() {
    await new Promise(r => setTimeout(r, 2000))
    const entries = []

    // Ищем строки: реальная <table> или div-based
    // Пробуем несколько вариантов селекторов
    let rows = []

    // Вариант 1: настоящая HTML таблица
    const tableRows = document.querySelectorAll("table tr")
    if (tableRows.length > 0) {
      rows = Array.from(tableRows)
      console.log(`[HuskLabel] SC DOM: нашли ${rows.length} <tr> строк`)
    }

    // Вариант 2: div-based таблица (React)
    if (rows.length === 0) {
      // Ищем контейнер с данными моделей
      const containers = document.querySelectorAll([
        "[class*='tableBody'] > *",
        "[class*='TableBody'] > *",
        "[class*='tbody'] > *",
        "[class*='Tbody'] > *",
        "[class*='table-body'] > *",
        "[class*='rows'] > *",
        "[class*='Rows'] > *",
      ].join(","))
      if (containers.length > 0) {
        rows = Array.from(containers)
        console.log(`[HuskLabel] SC DOM: нашли ${rows.length} div-строк`)
      }
    }

    // Вариант 3: поиск по тексту (если структура нестандартная)
    if (rows.length === 0) {
      console.log("[HuskLabel] SC DOM: строки не найдены. Пробуем поиск по тексту...")
      return readByTextSearch()
    }

    for (const row of rows) {
      const rowText = (row.textContent || "").trim()

      // Пропускаем header строку (содержит названия колонок)
      if (/^(чаевые|pvt|c2c|подглядыв|альбом|модел|последн)/i.test(rowText)) continue
      if (/чаевые.{0,20}pvt|pvt.{0,20}c2c/i.test(rowText)) continue // header с несколькими колонками

      // Пропускаем итоговую строку
      if (/всего за|итого|total\b/i.test(rowText)) continue

      // Получаем ячейки
      const cells = Array.from(row.querySelectorAll(
        "td, th, [class*='Cell'], [class*='cell'], [class*='Col']:not([class*='color'])"
      ))
      if (cells.length < 3) continue

      // Ищем имя модели — ячейка с буквами, НЕ только цифры
      let username = null
      let usernameIdx = -1
      for (let i = 0; i < cells.length; i++) {
        const t = cells[i].textContent.trim()
        // Имя модели: начинается с буквы, содержит только буквы/цифры/underscore
        if (/^[a-zA-Z][a-zA-Z0-9_]{2,39}$/.test(t)) {
          const skip = ["pvt","c2c","total","всего","итого","period","период","studio","admin"]
          if (!skip.includes(t.toLowerCase())) {
            username = t.toLowerCase()
            usernameIdx = i
            break
          }
        }
      }

      if (!username) continue

      // Суммируем токены — всё что ПОСЛЕ ячейки с именем
      // (чтобы не считать rank-номер который стоит ДО имени)
      let totalTokens = 0
      for (let i = usernameIdx + 1; i < cells.length; i++) {
        const t = cells[i].textContent.trim()
        if (/^\d+$/.test(t)) totalTokens += parseInt(t, 10)
      }

      if (!entries.find(e => e.username === username)) {
        const usd = Math.round(totalTokens * TOKEN_RATE * 100) / 100
        entries.push({ username, amount: usd })
        console.log(`[HuskLabel] SC DOM ✓ ${username}: ${totalTokens} токенов → $${usd}`)
      }
    }

    return entries
  }

  // Поиск по тексту страницы если таблица не нашлась структурно
  async function readByTextSearch() {
    const entries = []

    // Ищем все элементы у которых textContent = имя модели (буквы+underscore)
    const allEls = Array.from(document.querySelectorAll("span, div, td, p, a"))
    for (const el of allEls) {
      // Только листовые элементы (без дочерних)
      if (el.children.length > 0) continue
      const t = (el.textContent || "").trim()
      if (!/^[a-zA-Z][a-zA-Z0-9_]{2,39}$/.test(t)) continue

      const skip = ["pvt","c2c","total","всего","studio","admin","stripchat","home","cam","live"]
      if (skip.includes(t.toLowerCase())) continue

      // Ищем родительскую строку
      const row = el.closest("tr,[class*='Row'],[class*='row']")
      if (!row) continue
      if (/всего за|total\b/i.test(row.textContent)) continue

      const username = t.toLowerCase()
      if (entries.find(e => e.username === username)) continue

      // Числа в той же строке
      const nums = (row.textContent.match(/\b\d+\b/g) || []).map(Number)
      const totalTokens = nums.reduce((s, n) => s + n, 0)

      if (!entries.find(e => e.username === username)) {
        const usd = Math.round(totalTokens * TOKEN_RATE * 100) / 100
        entries.push({ username, amount: usd })
        console.log(`[HuskLabel] SC text-search ✓ ${username}: ${totalTokens} tk → $${usd}`)
      }
    }

    return entries
  }

  // Переключение на "Текущий месяц"
  async function clickCurrentMonth() {
    const btns = Array.from(document.querySelectorAll(
      "button,[role='tab'],[class*='tab'],[class*='Tab'],[class*='period'],[class*='Period'],[class*='filter'],[class*='Filter']"
    ))
    const curr = btns.find(el => /текущ|current.?month|this.?month/i.test(el.textContent))
    if (curr) {
      // Кликаем прошлый период сначала чтобы форсировать обновление
      const prev = btns.find(el => /последн|прошл|last|previous|30/i.test(el.textContent) && el !== curr)
      if (prev) { prev.click(); await new Promise(r => setTimeout(r, 500)) }
      curr.click()
      console.log("[HuskLabel] SC: кликнули 'Текущий месяц'")
      await new Promise(r => setTimeout(r, 2500))
      return true
    }
    console.log("[HuskLabel] SC: кнопка 'Текущий месяц' не найдена, читаем как есть")
    return false
  }

  // ================================================================
  // Главная функция
  // ================================================================
  async function collect() {
    if (!location.hostname.includes("stripchat.com")) return
    console.log(`[HuskLabel] StripChat v2.3 — ${location.href}`)

    // Переключаем на текущий месяц
    await clickCurrentMonth()

    // Читаем таблицу
    const domEntries = await readTable()
    if (domEntries.length > 0) {
      console.log(`[HuskLabel] SC: отправляем ${domEntries.length} моделей`)
      window.HuskLabel.sendBatchStats(PLATFORM, domEntries)
      return
    }

    // Резерв: interceptor мог поймать данные пока мы ждали
    await new Promise(r => setTimeout(r, 1500))
    tryFlush()

    if (Object.keys(window.__huskUserEarnings).length === 0 && domEntries.length === 0) {
      console.warn("[HuskLabel] SC: данные не найдены. Убедитесь что открыта страница ru.stripchat.com/studio-earnings")
    }
  }

  window.HuskLabel.collect = collect

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(collect, 2000))
  } else {
    setTimeout(collect, 1500)
  }
})()

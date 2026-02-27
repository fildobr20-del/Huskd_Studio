// ============================================================
// Husk Label — StripChat v2.9
// Читаем таблицу /studio-earnings напрямую из DOM.
// Таблица: [rank] [Model_Name] [чаевые] [pvt] [c2c] [подгляды] [офлайн] [альбомы] [видео] [фан-кл] ... [ВСЕГО]
// Имена моделей — текст ячеек (НЕ ссылки).
// v2.7: читаем ТОЛЬКО колонку ВСЕГО (не суммируем все ячейки — иначе 3× из-за агрегатов ВСЕ НЕ VR/ВСЕ VR/ВСЕГО)
//       findTableContainer() ищет модели по имени (не по leafCount)
//       readByTextSearch() использует parseTokenText() и MAX_TOTAL_TOKENS санитарную проверку
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
    const idKey   = keys.find(k => ["id","userid","user_id","modelid","performerid","actorid"].includes(k.toLowerCase()))
    const nameKey = keys.find(k => ["username","login","slug","nickname","name","handle","screenname"].includes(k.toLowerCase()))
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

      // Получаем ячейки — пробуем несколько вариантов
      let cells = Array.from(row.querySelectorAll(
        "td, th, [class*='Cell'], [class*='cell'], [class*='Col']:not([class*='color'])"
      ))
      // Fallback: прямые дети строки (React div-таблицы без class="Cell")
      if (cells.length < 3) cells = Array.from(row.children)
      // Fallback 2: вложенные span/div у которых только текст
      if (cells.length < 3) cells = Array.from(row.querySelectorAll("span, div")).filter(e => e.children.length === 0)
      if (cells.length < 3) continue

      // Ищем имя модели — ячейка с буквами, НЕ только цифры
      let username = null
      let usernameIdx = -1
      for (let i = 0; i < cells.length; i++) {
        const t = cells[i].textContent.trim()
        if (isModelName(t)) {
          username = t.toLowerCase()
          usernameIdx = i
          break
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

  // Поиск по тексту страницы — fallback если position-based не сработал.
  // Использует позицию колонки ВСЕГО чтобы не суммировать агрегатные столбцы.
  async function readByTextSearch() {
    const entries = []
    const MAX_TOKENS_PER_CELL = 50000

    // Ищем позицию заголовка ВСЕГО для точного чтения (как в readTableByPosition)
    const pageLeafs = Array.from(document.querySelectorAll("*"))
      .filter(el => el.children.length === 0 && (el.textContent || "").trim().length > 0)

    const vsegoHeaderEl = pageLeafs.find(el => /^всего$/i.test((el.textContent || "").trim()))
    const vsegoRect = vsegoHeaderEl?.getBoundingClientRect()
    const hasVsego = vsegoRect && vsegoRect.width > 0
    if (hasVsego) {
      console.log(`[HuskLabel] SC text-search: ВСЕГО @ x=${Math.round(vsegoRect.left)}-${Math.round(vsegoRect.right)}`)
    }

    // Все листовые элементы с именами моделей
    for (const el of pageLeafs) {
      const t = (el.textContent || "").trim()
      if (!isModelName(t)) continue

      const username = t.toLowerCase()
      if (entries.find(e => e.username === username)) continue

      const nameRect = el.getBoundingClientRect()
      if (nameRect.width === 0 && nameRect.height === 0) continue

      let totalTokens = 0

      if (hasVsego) {
        // === Используем позицию ВСЕГО — берём только одно число из правой колонки ===
        for (const lf of pageLeafs) {
          const r = lf.getBoundingClientRect()
          if (r.top >= nameRect.bottom - 2 || r.bottom <= nameRect.top + 2) continue
          if (r.left < vsegoRect.left - 15 || r.right > vsegoRect.right + 15) continue
          const num = parseTokenText((lf.textContent || "").trim())
          if (!isNaN(num) && num >= 0 && num <= MAX_TOKENS_PER_CELL) {
            totalTokens = num
            break
          }
        }
      } else {
        // === Fallback: ищем строку и суммируем только прямые числовые дети ===
        let row = el.closest("tr,[class*='Row'],[class*='row'],[class*='item'],[class*='Item']")
        if (!row) {
          let p = el.parentElement
          while (p && p !== document.body) {
            const numLeafs = Array.from(p.children).filter(c => {
              if (c.children.length > 0) return false
              const v = parseTokenText((c.textContent || "").trim())
              return !isNaN(v) && v <= MAX_TOKENS_PER_CELL
            })
            if (numLeafs.length >= 2) { row = p; break }
            p = p.parentElement
          }
        }
        if (!row || /всего за|total\b/i.test(row.textContent)) continue

        const rowLeafs = Array.from(row.querySelectorAll("*"))
          .filter(c => c.children.length === 0 && c !== el)
        for (const lf of rowLeafs) {
          const num = parseTokenText((lf.textContent || "").trim())
          if (isNaN(num) || num > MAX_TOKENS_PER_CELL) continue
          totalTokens += num
        }
        // Санитарная проверка
        if (totalTokens > 300000) {
          console.warn(`[HuskLabel] SC text-search SKIP ${username}: ${totalTokens} tk (слишком много)`)
          continue
        }
      }

      if (totalTokens <= 0) continue

      const usd = Math.round(totalTokens * TOKEN_RATE * 100) / 100
      entries.push({ username, amount: usd })
      console.log(`[HuskLabel] SC text-search ✓ ${username}: ${totalTokens} tk → $${usd}`)
    }

    return entries
  }

  // Переключение на "Текущий месяц"
  async function clickCurrentMonth() {
    // Ищем ВСЕ элементы у которых текст точно совпадает с "Текущий месяц"
    const allEls = Array.from(document.querySelectorAll("button, a, div, span, li, [role='tab'], [role='button']"))
    const curr = allEls.find(el => {
      const t = (el.textContent || "").trim()
      return /^текущ.*месяц$/i.test(t) || /^current.?month$/i.test(t) || t === "Текущий месяц"
    })

    if (curr) {
      curr.click()
      console.log(`[HuskLabel] SC: кликнули 'Текущий месяц' (${curr.tagName}.${curr.className.slice(0,30)})`)
      await new Promise(r => setTimeout(r, 2500))
      return true
    }

    // Дамп всех коротких текстовых элементов для отладки
    console.log("[HuskLabel] SC: кнопка 'Текущий месяц' не найдена. Тексты кнопок на странице:")
    allEls.forEach(el => {
      const t = (el.textContent || "").trim()
      if (t.length > 2 && t.length < 50 && el.children.length === 0) {
        console.log(`  [${el.tagName}]: "${t}"`)
      }
    })
    console.log("[HuskLabel] SC: читаем как есть")
    return false
  }

  // ================================================================
  // СТРАТЕГИЯ: читаем таблицу по визуальным координатам (getBoundingClientRect)
  // Работает даже если DOM-структура колоночная (column-based React table)
  // ================================================================

  // Парсим число из текста с учётом русского формата "4 504" (тонкий пробел как разделитель)
  function parseTokenText(raw) {
    const clean = raw.replace(/[\u00A0\u202F\u2009\u2003\u2002\u2001\s]/g, "")
    if (!/^\d+$/.test(clean)) return NaN
    return parseInt(clean, 10)
  }

  // Ключевые слова заголовков (колонки таблицы) — НЕ имена моделей
  const HEADER_WORDS = new Set([
    "чаевые","pvt","c2c","модели","модель","альбомы","видео",
    "подглядывание","офлайн","период","фан","клуб","rank","total",
    "всего","итого","tips","private","voyeur","earnings","tokens",
  ])

  function isModelName(t) {
    return /^[A-Za-z][A-Za-z0-9_]{2,39}$/.test(t) && !HEADER_WORDS.has(t.toLowerCase())
  }

  // Находим контейнер таблицы — ищем элемент, содержащий имена моделей.
  // Старый подход (leafCount >= 40) возвращал HEADER ROW вместо DATA BODY.
  // Новый подход: идём вверх от "ЧАЕВЫЕ" пока не найдём контейнер с >=2 именами моделей.
  function findTableContainer() {
    const allEls = Array.from(document.querySelectorAll("div, span, th, td"))
    const tipsHeader = allEls.find(el =>
      el.children.length === 0 && /^чаевые$/i.test((el.textContent || "").trim())
    )
    if (tipsHeader) {
      let p = tipsHeader.parentElement
      while (p && p !== document.body) {
        // Считаем листовые элементы с именами моделей внутри этого контейнера
        const leaves = Array.from(p.querySelectorAll("*"))
          .filter(el => el.children.length === 0)
        const modelNameCount = leaves.filter(el => isModelName((el.textContent || "").trim())).length
        if (modelNameCount >= 2) {
          console.log(`[HuskLabel] SC findContainer: ${modelNameCount} имён в ${p.tagName}.${[...p.classList].slice(0,2).join(".")}`)
          return p
        }
        p = p.parentElement
      }
    }

    // Fallback по классам
    const byClass = document.querySelector(
      "[class*='EarningsTable'],[class*='earningsTable'],[class*='tableBody'],[class*='TableBody'],[class*='tbody']"
    )
    if (byClass) return byClass

    console.log("[HuskLabel] SC findContainer: контейнер не найден, используем body")
    return document.body
  }

  function readTableByPosition() {
    const entries = []

    const container = findTableContainer()
    console.log(`[HuskLabel] SC pos: контейнер = ${container.tagName}.${[...container.classList].slice(0,2).join(".")}`)

    // Используем "*" — имена моделей могут быть в <a> или других нестандартных тегах
    const allLeafs = Array.from(container.querySelectorAll("*"))
      .filter(el => el.children.length === 0 && (el.textContent || "").trim().length > 0)

    const nameEls = allLeafs.filter(el => isModelName(el.textContent.trim()))
    console.log(`[HuskLabel] SC pos: нашли ${nameEls.length} имён моделей`)

    const MAX_TOKENS_PER_CELL = 50000

    for (const nameEl of nameEls) {
      const name = nameEl.textContent.trim().toLowerCase()
      if (entries.find(e => e.username === name)) continue

      const rect = nameEl.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) continue

      // Собираем все листовые элементы в той же визуальной строке, правее имени модели.
      // getBoundingClientRect работает даже для off-screen элементов (горизонтальный скролл).
      const rowEls = allLeafs.filter(el => {
        const r = el.getBoundingClientRect()
        return r.top < rect.bottom - 2    // пересекается по Y сверху
          && r.bottom > rect.top + 2       // пересекается по Y снизу
          && r.left > rect.right - 5       // правее ячейки с именем
      })

      console.log(`[HuskLabel] SC pos ${name}: ${rowEls.length} ячеек в строке`)

      // Стратегия: ВСЕГО — самый ПРАВЫЙ столбец таблицы.
      // Берём числовой элемент с максимальным X → это и есть ВСЕГО.
      // Не нужно сравнивать X с заголовком (там могут быть расхождения из-за padding/align).
      let rightmostX = -Infinity
      let rightmostNum = NaN

      for (const el of rowEls) {
        const r = el.getBoundingClientRect()
        const num = parseTokenText(el.textContent.trim())
        if (isNaN(num) || num > MAX_TOKENS_PER_CELL) continue
        if (r.left > rightmostX) {
          rightmostX = r.left
          rightmostNum = num
        }
      }

      if (!isNaN(rightmostNum) && rightmostNum > 0) {
        const usd = Math.round(rightmostNum * TOKEN_RATE * 100) / 100
        entries.push({ username: name, amount: usd })
        console.log(`[HuskLabel] SC pos ✓ ${name}: ${rightmostNum} tk (x=${Math.round(rightmostX)}) → $${usd}`)
      } else {
        console.log(`[HuskLabel] SC pos ${name}: числа не найдены`)
      }
    }

    return entries
  }

  // ================================================================
  // Главная функция
  // ================================================================
  async function collect() {
    if (!location.hostname.includes("stripchat.com")) return
    console.log(`[HuskLabel] StripChat v2.9 — ${location.href}`)

    // Переключаем на текущий месяц
    await clickCurrentMonth()

    // Стратегия 1: классическое чтение DOM таблицы (row-based)
    const domEntries = await readTable()
    if (domEntries.length > 0) {
      console.log(`[HuskLabel] SC DOM row: отправляем ${domEntries.length} моделей`)
      window.HuskLabel.sendBatchStats(PLATFORM, domEntries)
      return
    }

    // Стратегия 2: чтение по визуальным координатам (column-based / любая структура)
    const posEntries = readTableByPosition()
    if (posEntries.length > 0) {
      console.log(`[HuskLabel] SC pos: отправляем ${posEntries.length} моделей`)
      window.HuskLabel.sendBatchStats(PLATFORM, posEntries)
      return
    }

    // Стратегия 3: поиск по тексту
    const textEntries = await readByTextSearch()
    if (textEntries.length > 0) {
      console.log(`[HuskLabel] SC text: отправляем ${textEntries.length} моделей`)
      window.HuskLabel.sendBatchStats(PLATFORM, textEntries)
      return
    }

    // Стратегия 4: interceptor — ждём flush
    await new Promise(r => setTimeout(r, 1500))
    tryFlush()

    if (Object.keys(window.__huskUserEarnings).length === 0) {
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

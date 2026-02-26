// ============================================================
// Husk Label — Общие утилиты для content-scripts
// ============================================================

window.HuskLabel = window.HuskLabel || {}

/**
 * Извлекает число из строки. Поддерживает форматы:
 *   "$1,234.56"  →  1234.56
 *   "1 234,56"   →  1234.56
 *   "1.5K"       →  1500
 */
window.HuskLabel.parseAmount = function (str) {
  if (!str) return 0
  const s = String(str).trim()
  const kMatch = s.match(/([\d.,]+)\s*[kK]/)
  if (kMatch) return parseFloat(kMatch[1].replace(/,/g, "")) * 1000
  const mMatch = s.match(/([\d.,]+)\s*[mM]/)
  if (mMatch) return parseFloat(mMatch[1].replace(/,/g, "")) * 1000000
  const cleaned = s.replace(/[^0-9.,]/g, "")
  if (!cleaned) return 0
  if (cleaned.includes(".") && cleaned.includes(",")) {
    const lastDot = cleaned.lastIndexOf(".")
    const lastComma = cleaned.lastIndexOf(",")
    if (lastDot > lastComma) return parseFloat(cleaned.replace(/,/g, ""))
    else return parseFloat(cleaned.replace(/\./g, "").replace(",", "."))
  }
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    const parts = cleaned.split(",")
    if (parts[parts.length - 1].length <= 2) return parseFloat(cleaned.replace(",", "."))
    return parseFloat(cleaned.replace(/,/g, ""))
  }
  return parseFloat(cleaned) || 0
}

window.HuskLabel.findElement = function (selectors, root) {
  const r = root || document
  for (const sel of selectors) {
    try {
      const el = r.querySelector(sel)
      if (el) return el
    } catch (e) {}
  }
  return null
}

window.HuskLabel.findElements = function (selectors, root) {
  const r = root || document
  for (const sel of selectors) {
    try {
      const els = r.querySelectorAll(sel)
      if (els && els.length > 0) return Array.from(els)
    } catch (e) {}
  }
  return []
}

window.HuskLabel.findAmountNearKeyword = function (keywords, root) {
  const r = root || document
  const text = r.body ? r.body.innerText : ""
  for (const kw of keywords) {
    const idx = text.toLowerCase().indexOf(kw.toLowerCase())
    if (idx === -1) continue
    const snippet = text.substring(Math.max(0, idx - 50), idx + 200)
    const match = snippet.match(/\$\s?([\d,. ]+)/)
    if (match) return window.HuskLabel.parseAmount(match[1])
    const match2 = snippet.match(/([\d]+[.,][\d]+)/)
    if (match2) return window.HuskLabel.parseAmount(match2[1])
  }
  return 0
}

window.HuskLabel.sendStats = function (platform, username, amount) {
  if (!amount || amount <= 0) {
    console.log(`[HuskLabel] ${platform}: нет заработка для отправки`)
    return
  }
  console.log(`[HuskLabel] Отправляем: ${platform} | user: ${username} | amount: $${amount}`)
  chrome.runtime.sendMessage(
    { action: "SEND_STATS", payload: { platform, username, amount } },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("[HuskLabel] Ошибка:", chrome.runtime.lastError.message)
        return
      }
      if (response?.success) {
        console.log(`[HuskLabel] ✅ Успешно отправлено`)
      } else {
        console.warn(`[HuskLabel] ⚠️ Ответ:`, response)
      }
    }
  )
}

// Отправка нескольких моделей сразу (для студийного аккаунта)
window.HuskLabel.sendBatchStats = function (platform, entries) {
  // entries = [{username, amount}, ...]
  const valid = entries.filter(e => e.username && e.amount > 0)
  if (valid.length === 0) {
    console.log(`[HuskLabel] ${platform}: нет данных для отправки`)
    return
  }
  console.log(`[HuskLabel] Batch: ${platform} | ${valid.length} моделей`)
  chrome.runtime.sendMessage(
    { action: "SEND_BATCH_STATS", payload: { platform, entries: valid } },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("[HuskLabel] Ошибка:", chrome.runtime.lastError.message)
        return
      }
      console.log(`[HuskLabel] Batch ответ:`, response)
    }
  )
}

window.HuskLabel.waitForElement = function (selector, timeout) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector)
    if (existing) return resolve(existing)
    const t = timeout || 10000
    const observer = new MutationObserver((mutations, obs) => {
      const el = document.querySelector(selector)
      if (el) { obs.disconnect(); resolve(el) }
    })
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true })
    setTimeout(() => { observer.disconnect(); resolve(null) }, t)
  })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "COLLECT_NOW") {
    sendResponse({ received: true, url: location.href })
    if (typeof window.HuskLabel.collect === "function") {
      window.HuskLabel.collect()
    }
  }
})

// Слушаем URL-логи от interceptor (MAIN world → ISOLATED world → background)
window.addEventListener("message", (event) => {
  if (event.data?.type === "__HUSK_URL_LOG__") {
    chrome.runtime.sendMessage({
      action: "LOG_URL",
      payload: { url: event.data.url, status: event.data.status }
    }).catch(() => {})
  }
})

// ============================================================
// Husk Label Stats — Popup Logic v1.1
// ============================================================

const $ = (id) => document.getElementById(id)

// Подсказки по платформе на текущей вкладке
const PLATFORM_HINTS = {
  "stripchat.com": "StripChat: откройте /studio/statistics или /studio/finance для сбора данных по всем моделям",
  "chaturbate.com": "Chaturbate: откройте /studio/ или /earnings/ для сбора данных",
  "skyprivate.com": "SkyPrivate: откройте страницу с балансом/заработком",
  "flirt4free.com": "Flirt4Free: откройте страницу Studio → Statistics",
  "xmodels.com": "XModels: откройте страницу с заработком",
}

// ---- Tabs ----
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"))
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"))
    tab.classList.add("active")
    const target = $(`tab-${tab.dataset.tab}`)
    if (target) target.classList.add("active")
  })
})

// ---- Status & Page Hint ----
async function checkStatus() {
  const cfg = await getConfig()
  const dot = $("status-dot")
  const text = $("status-text")
  const hint = $("page-hint")

  // Показываем подсказку по текущей странице
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || ""
    let hintText = "Откройте страницу платформы для автосбора"
    for (const [domain, msg] of Object.entries(PLATFORM_HINTS)) {
      if (url.includes(domain)) { hintText = msg; break }
    }
    if (hint) hint.textContent = hintText
  })

  try {
    const resp = await fetch(cfg.apiUrl.replace("/api/scraper", "/"), { method: "HEAD" })
    dot.className = "status-dot"
    text.textContent = "Сервер доступен"
  } catch (e) {
    dot.className = "status-dot warning"
    text.textContent = "Сервер недоступен"
  }
}

async function getConfig() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "GET_CONFIG" }, (cfg) => {
      resolve(cfg || {
        apiUrl: "https://huskdlabl.site/api/scraper",
        apiSecret: "huskd-admin-2026",
        syncIntervalMinutes: 30,
      })
    })
  })
}

function loadConfig() {
  chrome.runtime.sendMessage({ action: "GET_CONFIG" }, (cfg) => {
    if (!cfg) return
    $("cfg-url").value = cfg.apiUrl || "https://huskdlabl.site/api/scraper"
    $("cfg-secret").value = cfg.apiSecret || "huskd-admin-2026"
    $("cfg-interval").value = cfg.syncIntervalMinutes || 30
  })
}

$("btn-save-cfg").addEventListener("click", () => {
  const config = {
    apiUrl: $("cfg-url").value.trim() || "https://huskdlabl.site/api/scraper",
    apiSecret: $("cfg-secret").value.trim() || "huskd-admin-2026",
    syncIntervalMinutes: parseInt($("cfg-interval").value) || 30,
    autoSyncEnabled: true,
  }
  chrome.runtime.sendMessage({ action: "SAVE_CONFIG", config }, () => {
    const msg = $("cfg-save-msg")
    msg.style.display = "block"
    setTimeout(() => (msg.style.display = "none"), 2000)
  })
})

function loadSyncs() {
  chrome.runtime.sendMessage({ action: "GET_LAST_SYNCS" }, (syncs) => {
    const list = $("sync-list")
    if (!syncs || Object.keys(syncs).length === 0) {
      list.innerHTML = '<li class="empty-state">Нет данных о синхронизациях</li>'
      return
    }
    const entries = Object.values(syncs)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15)
    list.innerHTML = entries.map((s) => {
      const d = new Date(s.timestamp)
      const timeStr = d.toLocaleString("ru", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      const r = s.result || {}

      // Определяем статус записи в БД
      let statusIcon, statusText, statusColor
      if (r.error === "model not found") {
        statusIcon = "✗"; statusText = "не найден в панели"; statusColor = "#ef4444"
      } else if (r.delta > 0) {
        statusIcon = "✓"; statusText = `+$${r.delta} сохранено`; statusColor = "#22c55e"
      } else if (r.note === "no new earnings") {
        statusIcon = "—"; statusText = "нет изменений"; statusColor = "#555566"
      } else if (r.note === "zero earnings") {
        statusIcon = "—"; statusText = "0 заработка"; statusColor = "#555566"
      } else {
        statusIcon = "?"; statusText = "отправлено"; statusColor = "#8888aa"
      }

      return `
      <li class="sync-item">
        <div>
          <div class="sync-platform">${s.platform}</div>
          <div class="sync-user">@${s.username}</div>
          <div style="font-size:10px;color:${statusColor};margin-top:2px">${statusIcon} ${statusText}</div>
        </div>
        <div style="text-align:right">
          <div class="sync-amount">$${(s.amount||0).toFixed(2)}</div>
          <div class="sync-time">${timeStr}</div>
        </div>
      </li>`
    }).join("")
  })
}

// Определяем платформу по URL
function getPlatformFromUrl(url) {
  if (url.includes("stripchat.com")) return "stripchat"
  if (url.includes("chaturbate.com")) return "chaturbate"
  if (url.includes("skyprivate.com")) return "skyprivate"
  if (url.includes("flirt4free.com")) return "flirt4free"
  if (url.includes("xmodels.com")) return "xmodels"
  return null
}

$("btn-collect").addEventListener("click", async () => {
  const msg = $("status-msg")
  const btn = $("btn-collect")
  btn.disabled = true
  btn.textContent = "⏳ Собираем..."

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab) throw new Error("Нет активной вкладки")

    const url = tab.url || ""
    const platform = getPlatformFromUrl(url)

    if (!platform) {
      msg.textContent = "⚠️ Откройте страницу поддерживаемой платформы"
      msg.style.color = "#f59e0b"
      return
    }

    // Шаг 1: interceptor в MAIN world (перехватывает fetch/XHR самой страницы)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-scripts/interceptor.js"],
      world: "MAIN"
    })

    // Шаг 2: utils + платформенный скрипт в ISOLATED world
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-scripts/utils.js"]
    })
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [`content-scripts/${platform}.js`]
    })

    msg.textContent = "✓ Сбор запущен — ждите уведомления (~5 сек)"
    msg.style.color = "#22c55e"
    setTimeout(loadSyncs, 5000)
    setTimeout(loadSyncs, 10000)

  } catch (err) {
    msg.textContent = `⚠️ Ошибка: ${err.message}`
    msg.style.color = "#f59e0b"
    console.error("[HuskLabel popup]", err)
  } finally {
    btn.disabled = false
    btn.textContent = "▶ Собрать сейчас"
    setTimeout(() => (msg.textContent = ""), 12000)
  }
})

$("btn-manual-send").addEventListener("click", () => {
  const platform = $("manual-platform").value
  const username = $("manual-username").value.trim()
  const amount = parseFloat($("manual-amount").value)
  const msg = $("manual-msg")

  if (!username) { alert("Укажите никнейм модели"); return }
  if (!amount || amount <= 0) { alert("Укажите сумму заработка"); return }

  chrome.runtime.sendMessage(
    { action: "SEND_STATS", payload: { platform, username, amount } },
    (response) => {
      if (response?.success) {
        msg.textContent = "✓ Отправлено успешно"
        msg.style.color = "#22c55e"
        $("manual-username").value = ""
        $("manual-amount").value = ""
        setTimeout(loadSyncs, 1000)
      } else {
        msg.textContent = `✗ Ошибка: ${response?.error || "неизвестно"}`
        msg.style.color = "#ef4444"
      }
      msg.style.display = "block"
      setTimeout(() => (msg.style.display = "none"), 4000)
    }
  )
})

// ---- Вкладка обнаружения URL ----
function loadDiscoveredUrls() {
  chrome.runtime.sendMessage({ action: "GET_DISCOVERED_URLS" }, (urls) => {
    const list = $("url-list")
    if (!list) return
    if (!urls || urls.length === 0) {
      list.innerHTML = '<li class="empty-state">Нет перехваченных запросов.<br>Нажмите «Собрать» и перейдите в раздел Statistics.</li>'
      return
    }
    list.innerHTML = urls.map(u => {
      const short = u.url.replace(/https?:\/\/[^/]+/, "")
      const color = u.status === 200 ? "#22c55e" : u.status === 404 ? "#555566" : "#f59e0b"
      return `<li class="sync-item" style="flex-direction:column;align-items:flex-start;gap:2px">
        <span style="color:${color};font-size:10px;font-weight:600">${u.status}</span>
        <span style="font-size:10px;color:#aaaacc;word-break:break-all">${short}</span>
      </li>`
    }).join("")
  })
}

$("btn-refresh-urls")?.addEventListener("click", loadDiscoveredUrls)
$("btn-clear-urls")?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "CLEAR_DISCOVERED_URLS" }, () => loadDiscoveredUrls())
})

// Обновляем URL список при открытии вкладки debug
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "debug") loadDiscoveredUrls()
  })
})

checkStatus()
loadConfig()
loadSyncs()

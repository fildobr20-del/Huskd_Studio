// ============================================================
// Husk Label Stats Collector — Background Service Worker v1.1
// ============================================================

const DEFAULT_CONFIG = {
  apiUrl: "https://huskdlabl.site/api/scraper",
  apiSecret: "huskd-admin-2026",
  autoSyncEnabled: true,
  syncIntervalMinutes: 30,
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("config", (result) => {
    if (!result.config) {
      chrome.storage.local.set({ config: DEFAULT_CONFIG })
    }
  })
  setupAlarm()
})

chrome.runtime.onStartup.addListener(() => { setupAlarm() })

function setupAlarm() {
  chrome.storage.local.get("config", ({ config }) => {
    const interval = (config || DEFAULT_CONFIG).syncIntervalMinutes || 30
    chrome.alarms.clear("autoSync", () => {
      chrome.alarms.create("autoSync", { periodInMinutes: interval })
    })
  })
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "autoSync") {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && isMonitoredSite(tab.url)) {
          chrome.tabs.sendMessage(tab.id, { action: "COLLECT_NOW" }).catch(() => {})
        }
      })
    })
  }
})

function isMonitoredSite(url) {
  if (!url) return false
  return (
    url.includes("stripchat.com") ||
    url.includes("skyprivate.com") ||
    url.includes("flirt4free.com") ||
    url.includes("xmodels.com") ||
    url.includes("chaturbate.com")
  )
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Сохраняем перехваченные URL для режима обнаружения
  if (message.action === "LOG_URL") {
    chrome.storage.local.get("discoveredUrls", ({ discoveredUrls }) => {
      const urls = discoveredUrls || []
      const { url, status } = message.payload
      // Убираем дубликаты, храним последние 50
      const filtered = urls.filter(u => u.url !== url)
      filtered.unshift({ url, status, ts: Date.now() })
      chrome.storage.local.set({ discoveredUrls: filtered.slice(0, 50) })
    })
    sendResponse({ ok: true })
    return true
  }

  if (message.action === "GET_DISCOVERED_URLS") {
    chrome.storage.local.get("discoveredUrls", ({ discoveredUrls }) => {
      sendResponse(discoveredUrls || [])
    })
    return true
  }

  if (message.action === "CLEAR_DISCOVERED_URLS") {
    chrome.storage.local.set({ discoveredUrls: [] }, () => sendResponse({ ok: true }))
    return true
  }

  if (message.action === "SEND_STATS") {
    handleSendStats(message.payload)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }))
    return true
  }

  if (message.action === "SEND_BATCH_STATS") {
    handleBatchStats(message.payload)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }))
    return true
  }

  if (message.action === "GET_CONFIG") {
    chrome.storage.local.get("config", ({ config }) => {
      sendResponse(config || DEFAULT_CONFIG)
    })
    return true
  }

  if (message.action === "SAVE_CONFIG") {
    chrome.storage.local.set({ config: message.config }, () => {
      setupAlarm()
      sendResponse({ success: true })
    })
    return true
  }

  if (message.action === "GET_LAST_SYNCS") {
    chrome.storage.local.get("lastSyncs", ({ lastSyncs }) => {
      sendResponse(lastSyncs || {})
    })
    return true
  }
})

async function getConfig() {
  const { config } = await chrome.storage.local.get("config")
  return config || DEFAULT_CONFIG
}

// Отправка данных одной модели
async function handleSendStats({ platform, username, amount }) {
  if (!platform || !username || !amount || amount <= 0) {
    return { success: false, error: "Нет данных" }
  }

  const cfg = await getConfig()
  const body = {
    platform,
    data: {
      earnings: [{ username: username.toLowerCase().trim(), usdTotal: amount }],
    },
  }

  return await postToAPI(cfg, body, [{ username, amount, platform }])
}

// Batch-отправка нескольких моделей
async function handleBatchStats({ platform, entries }) {
  if (!platform || !entries || entries.length === 0) {
    return { success: false, error: "Нет данных" }
  }

  const cfg = await getConfig()
  const body = {
    platform,
    data: {
      earnings: entries.map(e => ({
        username: e.username.toLowerCase().trim(),
        usdTotal: e.amount,
      })),
    },
  }

  return await postToAPI(cfg, body, entries.map(e => ({ ...e, platform })))
}

async function postToAPI(cfg, body, entriesForLog) {
  try {
    const response = await fetch(cfg.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-scraper-secret": cfg.apiSecret,
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)

    // Сохраняем историю синхронизаций
    const { lastSyncs } = await chrome.storage.local.get("lastSyncs")
    const syncs = lastSyncs || {}
    const platform = body.platform

    for (const entry of entriesForLog) {
      const key = `${platform}_${entry.username.toLowerCase()}`
      const processed = result.results?.find(r => r.username === entry.username.toLowerCase())
      syncs[key] = {
        platform,
        username: entry.username,
        amount: entry.amount,
        timestamp: new Date().toISOString(),
        result: processed || {},
      }
    }
    await chrome.storage.local.set({ lastSyncs: syncs })

    // Уведомление
    const newEarnings = result.results?.filter(r => r.delta > 0) || []
    const msg = newEarnings.length > 0
      ? `Добавлено: ${newEarnings.map(r => `${r.username} +$${r.delta}`).join(", ")}`
      : `Обработано ${result.processed} записей, нет новых начислений`

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: `Husk Label — ${platform}`,
      message: msg,
    })

    return { success: true, result }
  } catch (err) {
    console.error("[HuskLabel] Ошибка API:", err)
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Husk Label — Ошибка",
      message: err.message,
    })
    return { success: false, error: err.message }
  }
}

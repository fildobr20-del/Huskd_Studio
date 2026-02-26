// ============================================================
// Husk Label — Network Interceptor (runs in MAIN/page world)
// ============================================================
// Перехватывает fetch и XHR запросы которые делает сам сайт
// и отправляет данные в content script через postMessage
// ============================================================

;(function () {
  if (window.__huskInterceptorInstalled) return
  window.__huskInterceptorInstalled = true

  function isInteresting(url) {
    // Перехватываем ВСЕ запросы к своему домену (чтобы обнаружить реальные endpoints)
    const u = (url || "").toLowerCase()
    const isOwn = u.includes(location.hostname.replace("ru.", "").replace("www.", ""))
    const isApi = u.includes("/api/") || u.includes(".json") || u.includes("graphql")
    return isOwn || isApi
  }

  function sendToContentScript(url, data) {
    try {
      window.postMessage({
        type: "__HUSK_INTERCEPTED__",
        url: url,
        data: data,
        ts: Date.now()
      }, "*")
    } catch (e) {}
  }

  // Также сохраняем все URL для режима обнаружения
  function logUrl(url, status) {
    try {
      window.postMessage({
        type: "__HUSK_URL_LOG__",
        url: url,
        status: status,
        ts: Date.now()
      }, "*")
    } catch (e) {}
  }

  // ---- Перехватываем fetch ----
  const _fetch = window.fetch
  window.fetch = async function (...args) {
    const url = typeof args[0] === "string" ? args[0] : (args[0]?.url || "")
    let resp
    try {
      resp = await _fetch.apply(this, args)
    } catch (e) {
      throw e
    }
    if (isInteresting(url)) {
      logUrl(url, resp.status)
      if (resp.status === 200) {
        resp.clone().text().then(text => {
          try {
            const json = JSON.parse(text)
            sendToContentScript(url, json)
          } catch (e) {}
        }).catch(() => {})
      }
    }
    return resp
  }

  // ---- Перехватываем XMLHttpRequest ----
  const _open = XMLHttpRequest.prototype.open
  const _send = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__huskUrl = url
    return _open.apply(this, arguments)
  }

  XMLHttpRequest.prototype.send = function () {
    const xhr = this
    xhr.addEventListener("load", function () {
      if (xhr.__huskUrl && isInteresting(xhr.__huskUrl)) {
        logUrl(xhr.__huskUrl, xhr.status)
        if (xhr.status === 200) {
          try {
            const json = JSON.parse(xhr.responseText)
            sendToContentScript(xhr.__huskUrl, json)
          } catch (e) {}
        }
      }
    })
    return _send.apply(this, arguments)
  }

  console.log("[HuskLabel] Interceptor установлен — ждём API запросов...")
})()

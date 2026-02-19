"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Loader2, Search, Users, X, DollarSign, Eye } from "lucide-react"

interface ModelData {
  id: string; email: string; role: string; platformNick: string; displayName: string;
  totalEarnings: number; recruitedBy: string | null; referralCode: string;
  platformNicks?: Record<string, string>;
}
interface Entry { id: string; date: string; amount: number; platform: string }

export default function AdminPage() {
  const [secret, setSecret] = useState("")
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<"earnings" | "payouts" | "recruiter_tx" | "network">("earnings")
  const [models, setModels] = useState<ModelData[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [entries, setEntries] = useState<Entry[]>([])
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [bulkRows, setBulkRows] = useState([{ date: new Date().toISOString().split("T")[0], amount: "", platform: "chaturbate" }])
  const [bulkLoading, setBulkLoading] = useState(false)

  const headers: Record<string, string> = { "x-admin-secret": "huskd-admin-2026", "Content-Type": "application/json" }

  const handleAuth = () => {
    if (secret === "huskd-admin-2026") setAuthed(true)
    else setMessage("Неверный пароль")
  }

  useEffect(() => {
    if (!authed) return
    fetch("/api/admin/models", { headers }).then(r => r.json()).then(d => setModels(d.models || []))
  }, [authed])

  useEffect(() => {
    if (!selectedModel || !authed) return
    loadEntries()
  }, [selectedModel])

  const loadEntries = () => {
    fetch(`/api/admin/earnings?userId=${selectedModel}`, { headers })
      .then(r => r.json()).then(d => setEntries(d.entries || []))
  }

  const handleBulkAdd = async () => {
    const valid = bulkRows.filter(r => r.amount && parseFloat(r.amount) > 0)
    if (!selectedModel || valid.length === 0) return
    setBulkLoading(true)
    for (const row of valid) {
      await fetch("/api/admin/earnings", {
        method: "POST", headers,
        body: JSON.stringify({ userId: selectedModel, date: row.date, amount: parseFloat(row.amount), platform: row.platform }),
      })
    }
    setMessage(`✅ Добавлено ${valid.length} записей`)
    setBulkRows([{ date: new Date().toISOString().split("T")[0], amount: "", platform: "chaturbate" }])
    setBulkLoading(false)
    loadEntries()
  }

  const handleDeleteEntry = async (id: string) => {
    await fetch("/api/admin/earnings", { method: "DELETE", headers, body: JSON.stringify({ id }) })
    loadEntries()
  }

  const handleDeleteAccount = async (userId: string, email: string) => {
    if (!confirm(`Удалить аккаунт ${email}? Это необратимо!`)) return
    await fetch("/api/admin/models", { method: "DELETE", headers, body: JSON.stringify({ userId }) })
    setModels(prev => prev.filter(m => m.id !== userId))
    setMessage(`🗑 Аккаунт ${email} удалён`)
    if (selectedModel === userId) setSelectedModel("")
  }

  const addRow = () => {
    const last = bulkRows[bulkRows.length - 1]
    setBulkRows([...bulkRows, { date: last.date, amount: "", platform: last.platform }])
  }
  const updateRow = (i: number, field: string, value: string) => {
    const rows = [...bulkRows]; (rows[i] as any)[field] = value; setBulkRows(rows)
  }
  const removeRow = (i: number) => { if (bulkRows.length > 1) setBulkRows(bulkRows.filter((_, idx) => idx !== i)) }

  const filteredModels = models.filter(m =>
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.platformNick || "").toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))

  const selectedModelData = models.find(m => m.id === selectedModel)
  const realModels = models.filter(m => !m.email.includes("demo") && m.email !== "a@gmail.com")
  const totalUsers = realModels.length
  const totalModelsCount = realModels.filter(m => m.role === "model").length
  const totalRecruitersCount = realModels.filter(m => m.role === "recruiter").length
  const totalEarnings = realModels.reduce((s, m) => s + (m.totalEarnings || 0), 0)

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm glass-gold rounded-2xl p-8">
          <h1 className="mb-2 text-xl font-bold text-foreground">🔐 Admin Panel</h1>
          <p className="mb-4 text-sm text-muted-foreground">Husk'd Label Management</p>
          <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="Пароль" className="mb-3 w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground" onKeyDown={e => e.key === "Enter" && handleAuth()} />
          <button onClick={handleAuth} className="w-full rounded-full bg-gold-gradient py-3 text-sm font-semibold text-background">Войти</button>
          {message && <p className="mt-2 text-sm text-destructive">{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-lg font-bold text-foreground">⚡ Admin Panel</h1>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {(["earnings", "payouts", "recruiter_tx", "network"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "earnings" ? "📊 Данные" : t === "payouts" ? "💸 Выплаты моделям" : t === "recruiter_tx" ? "👥 Выплаты рекрутерам" : "🕸 Сеть"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {message && (
          <div className="mb-4 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-sm text-primary flex items-center justify-between">
            {message}<button onClick={() => setMessage("")}><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
          <StatBox label="Users" value={totalUsers} />
          <StatBox label="Models" value={totalModelsCount} color="text-violet-400" />
          <StatBox label="Recruiters" value={totalRecruitersCount} color="text-blue-400" />
          <StatBox label="Total Gross" value={`$${totalEarnings.toLocaleString()}`} color="text-emerald-400" />
        </div>

        {/* EARNINGS TAB */}
        {tab === "earnings" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <ModelSelector models={filteredModels} selected={selectedModel} onSelect={setSelectedModel} search={search} onSearch={setSearch} onDelete={handleDeleteAccount} />
              {selectedModel && (
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Добавить доходы — {selectedModelData?.email}</h3>
                    <button onClick={addRow} className="rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20 flex items-center gap-1"><Plus className="h-3 w-3" /> Строка</button>
                  </div>
                  {bulkRows.map((row, i) => (
                    <div key={i} className="flex gap-2 items-center mb-2">
                      <input type="date" value={row.date} onChange={e => updateRow(i, "date", e.target.value)} className="flex-1 rounded-lg border border-border bg-background/50 py-2 px-3 text-sm text-foreground" />
                      <input type="number" step="0.01" value={row.amount} onChange={e => updateRow(i, "amount", e.target.value)} placeholder="$ gross" className="w-28 rounded-lg border border-border bg-background/50 py-2 px-3 text-sm text-foreground" />
                      <select value={row.platform} onChange={e => updateRow(i, "platform", e.target.value)} className="rounded-lg border border-border bg-background/50 py-2 px-2 text-xs text-foreground">
                        <option value="chaturbate">Chaturbate</option><option value="stripchat">StripChat</option><option value="bongacams">BongaCams</option>
                        <option value="skyprivate">SkyPrivate</option><option value="flirt4free">Flirt4Free</option><option value="xmodels">XModels</option>
                      </select>
                      {bulkRows.length > 1 && <button onClick={() => removeRow(i)} className="text-red-400/50 hover:text-red-400"><X className="h-4 w-4" /></button>}
                    </div>
                  ))}
                  <button onClick={handleBulkAdd} disabled={bulkLoading} className="mt-2 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 hover:bg-emerald-700">
                    {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Сохранить
                  </button>
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Записи {selectedModel ? `(${entries.length})` : ""}</h3>
              {!selectedModel ? <p className="text-xs text-muted-foreground py-8 text-center">Выберите пользователя</p> :
                entries.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">Нет записей</p> :
                <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto">
                  {entries.map(e => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground">{e.date}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{e.platform}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-400">${e.amount}</span>
                        <button onClick={() => handleDeleteEntry(e.id)} className="text-red-400/30 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          </div>
        )}

        {/* MODEL PAYOUTS TAB */}
        {tab === "payouts" && <PayoutsTab models={models.filter(m => m.role === "model")} headers={headers} setMessage={setMessage} label="модели" />}

        {/* RECRUITER PAYOUTS TAB */}
        {tab === "recruiter_tx" && <PayoutsTab models={models.filter(m => m.role === "recruiter")} headers={headers} setMessage={setMessage} label="рекрутера" isRecruiter />}

        {/* NETWORK TAB */}
        {tab === "network" && <ReferralMap models={models} />}
      </main>
    </div>
  )
}

// Shared components
function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</p>
    </div>
  )
}

function ModelSelector({ models, selected, onSelect, search, onSearch, onDelete }: {
  models: ModelData[]; selected: string; onSelect: (id: string) => void; search: string; onSearch: (s: string) => void; onDelete: (id: string, email: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Поиск по email или нику..." className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm text-foreground" />
      </div>
      <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
        {models.map(m => {
          const nicks = m.platformNicks || {}
          const nickList = Object.entries(nicks).filter(([_, v]) => v)
          return (
            <button key={m.id} onClick={() => onSelect(m.id)} className={`flex flex-col rounded-xl px-3 py-2.5 text-left text-sm transition w-full ${selected === m.id ? "bg-primary/10 border border-primary/20" : "hover:bg-white/[0.03]"}`}>
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-foreground">{m.email}</span>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${m.role === "model" ? "bg-violet-500/10 text-violet-400" : "bg-blue-500/10 text-blue-400"}`}>{m.role}</span>
                  <span className="text-xs font-bold text-emerald-400">${(m.totalEarnings || 0).toLocaleString()}</span>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(m.id, m.email) }} className="text-red-400/30 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              {nickList.length > 0 && (
                <div className="flex gap-2 mt-1 flex-wrap">
                  {nickList.map(([p, n]) => <span key={p} className="text-[10px] text-muted-foreground bg-white/[0.03] rounded px-1.5 py-0.5">{p}: <span className="text-foreground">{n as string}</span></span>)}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PayoutsTab({ models, headers, setMessage, label, isRecruiter }: {
  models: ModelData[]; headers: Record<string, string>; setMessage: (m: string) => void; label: string; isRecruiter?: boolean;
}) {
  const [selected, setSelected] = useState("")
  const [payouts, setPayouts] = useState<any[]>([])
  const [allPayouts, setAllPayouts] = useState<any[]>([])
  const [payLoading, setPayLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [customPlatform, setCustomPlatform] = useState("stripchat")
  const [showAll, setShowAll] = useState(false)

  const platforms = isRecruiter
    ? ["commission"]
    : ["chaturbate", "stripchat", "bongacams", "skyprivate", "flirt4free", "xmodels"]
  const platformLabels: Record<string, string> = {
    chaturbate: "Chaturbate", stripchat: "StripChat", bongacams: "BongaCams",
    skyprivate: "SkyPrivate", flirt4free: "Flirt4Free", xmodels: "XModels", commission: "Комиссия"
  }

  useEffect(() => {
    if (!selected) return
    fetch(`/api/admin/payouts?userId=${selected}`, { headers })
      .then(r => r.json()).then(d => setPayouts(d.payouts || []))
  }, [selected])

  useEffect(() => {
    if (showAll) {
      fetch(`/api/admin/payouts?all=true`, { headers })
        .then(r => r.json()).then(d => setAllPayouts(d.payouts || []))
    }
  }, [showAll])

  const handlePayout = async (platform: string) => {
    if (!selected) return
    setPayLoading(platform)
    const amount = customAmount ? parseFloat(customAmount) : undefined
    const res = await fetch("/api/admin/payouts", {
      method: "POST", headers,
      body: JSON.stringify({ userId: selected, platform, amount }),
    })
    const data = await res.json()
    if (data.success) {
      setMessage(`✅ Выплата ${platformLabels[platform]}: $${data.amount}`)
      setCustomAmount("")
      fetch(`/api/admin/payouts?userId=${selected}`, { headers })
        .then(r => r.json()).then(d => setPayouts(d.payouts || []))
    } else {
      setMessage(`❌ ${data.error || "Ошибка"}`)
    }
    setPayLoading(null)
  }

  const handleAddManualPayout = async () => {
    if (!selected || !customAmount || !customPlatform) return
    setPayLoading("manual")
    const res = await fetch("/api/admin/payouts", {
      method: "POST", headers,
      body: JSON.stringify({ userId: selected, platform: customPlatform, amount: parseFloat(customAmount) }),
    })
    const data = await res.json()
    if (data.success) {
      setMessage(`✅ Выплата $${customAmount} записана`)
      setCustomAmount("")
      fetch(`/api/admin/payouts?userId=${selected}`, { headers })
        .then(r => r.json()).then(d => setPayouts(d.payouts || []))
    }
    setPayLoading(null)
  }

  const handleDeletePayout = async (id: string) => {
    await fetch("/api/admin/payouts", { method: "DELETE", headers, body: JSON.stringify({ id }) })
    setPayouts(prev => prev.filter(p => p.id !== id))
    setAllPayouts(prev => prev.filter(p => p.id !== id))
    setMessage("🗑 Выплата удалена")
  }

  const filtered = models.filter(m =>
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.platformNick || "").toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: select user */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Выберите {label}</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm text-foreground" />
          </div>
          <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
            {filtered.map(m => (
              <button key={m.id} onClick={() => setSelected(m.id)} className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition w-full ${selected === m.id ? "bg-primary/10 border border-primary/20" : "hover:bg-white/[0.03]"}`}>
                <span className="text-foreground truncate">{m.email}</span>
                <span className="text-xs font-bold text-emerald-400 ml-2">${(m.totalEarnings || 0).toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: payout controls */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Выберите {label} слева</p>
          ) : (
            <>
              <h3 className="mb-4 text-sm font-semibold text-foreground">💸 Отметить выплату</h3>

              {/* Quick payout buttons */}
              {!isRecruiter && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {platforms.map(p => (
                    <button key={p} onClick={() => handlePayout(p)} disabled={payLoading === p} className="rounded-xl bg-emerald-600/10 border border-emerald-600/20 px-3 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50">
                      {payLoading === p ? <Loader2 className="h-4 w-4 animate-spin" /> : "💸"} {platformLabels[p]}
                    </button>
                  ))}
                </div>
              )}

              {/* Manual amount entry */}
              <div className="flex gap-2 mb-4">
                <input type="number" step="0.01" value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder="Сумма $" className="flex-1 rounded-lg border border-border bg-background/50 py-2 px-3 text-sm text-foreground" />
                <select value={customPlatform} onChange={e => setCustomPlatform(e.target.value)} className="rounded-lg border border-border bg-background/50 py-2 px-2 text-xs text-foreground">
                  {(isRecruiter ? ["commission"] : platforms).map(p => <option key={p} value={p}>{platformLabels[p]}</option>)}
                </select>
                <button onClick={handleAddManualPayout} disabled={payLoading === "manual" || !customAmount} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
                  {payLoading === "manual" ? <Loader2 className="h-4 w-4 animate-spin" /> : "+"}
                </button>
              </div>

              {/* User payout history */}
              {payouts.length > 0 && (
                <>
                  <h4 className="mb-2 text-xs font-semibold text-muted-foreground">История выплат ({payouts.length})</h4>
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {payouts.map(p => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                        <div>
                          <span className="text-xs text-foreground">{new Date(p.created_at).toLocaleDateString("ru-RU")}</span>
                          <span className="ml-2 text-[10px] text-muted-foreground uppercase">{p.platform}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-400">${p.amount}</span>
                          <button onClick={() => handleDeletePayout(p.id)} className="text-red-400/30 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* All payouts history */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">📋 Все выплаты {isRecruiter ? "рекрутерам" : "моделям"}</h3>
          <button onClick={() => setShowAll(!showAll)} className="text-xs text-primary hover:underline">{showAll ? "Скрыть" : "Показать"}</button>
        </div>
        {showAll && (
          allPayouts.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Нет выплат</p> :
          <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">
            {allPayouts.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground">{p.userLabel}</span>
                  <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ru-RU")}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{p.platform}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-400">${p.amount}</span>
                  <button onClick={() => handleDeletePayout(p.id)} className="text-red-400/30 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Referral Network
function ReferralMap({ models }: { models: ModelData[] }) {
  const recruiters = models.filter(m => m.role === "recruiter")
  const allModels = models.filter(m => m.role === "model")

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
      <h2 className="mb-2 text-lg font-bold text-foreground">🕸 Referral Network</h2>
      <p className="mb-6 text-sm text-muted-foreground">Карта связей — кто кого привёл</p>
      <div className="flex flex-col items-center gap-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
          <span className="text-xl font-bold text-background">H</span>
        </div>
        <p className="text-xs text-muted-foreground -mt-6">Husk'd Label</p>
        {recruiters.length === 0 && allModels.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8">Нет привязанных пользователей</p>
        ) : (
          <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recruiters.map(r => {
              const rModels = allModels.filter(m => m.recruitedBy === r.id)
              const rEarnings = rModels.reduce((s, m) => s + (m.totalEarnings || 0), 0)
              return (
                <div key={r.id} className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400"><Users className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{r.email}</p>
                      <p className="text-[10px] text-muted-foreground">{rModels.length} моделей · ${rEarnings.toLocaleString()} gross</p>
                    </div>
                  </div>
                  {rModels.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {rModels.sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0)).map(m => (
                        <div key={m.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-1.5">
                          <span className="text-xs text-foreground">{m.platformNick || m.email}</span>
                          <span className="text-xs font-bold text-emerald-400">${(m.totalEarnings || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[11px] text-muted-foreground/50">Нет моделей</p>}
                </div>
              )
            })}
            {(() => {
              const unlinked = allModels.filter(m => !m.recruitedBy)
              if (unlinked.length === 0) return null
              return (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-muted-foreground"><Users className="h-5 w-5" /></div>
                    <div><p className="text-sm font-bold text-foreground">Без рекрутера</p><p className="text-[10px] text-muted-foreground">{unlinked.length} моделей</p></div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {unlinked.map(m => (
                      <div key={m.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-1.5">
                        <span className="text-xs text-foreground">{m.platformNick || m.email}</span>
                        <span className="text-xs font-bold text-emerald-400">${(m.totalEarnings || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Plus, Search, Trash2 } from "lucide-react"

export default function AdminPage() {
  const [secret, setSecret] = useState("")
  const [authed, setAuthed] = useState(false)
  const [models, setModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [amount, setAmount] = useState("")
  const [platform, setPlatform] = useState("chaturbate")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [entries, setEntries] = useState<any[]>([])

  const handleAuth = () => {
    if (secret === "huskd-admin-2026") setAuthed(true)
    else setMessage("Неверный пароль")
  }

  useEffect(() => {
    if (!authed) return
    fetch("/api/admin/models", { headers: { "x-admin-secret": "huskd-admin-2026" } })
      .then(r => r.json())
      .then(d => setModels(d.models || []))
      .catch(() => {})
  }, [authed])

  useEffect(() => {
    if (!selectedModel || !authed) return
    fetch(`/api/admin/earnings?userId=${selectedModel}`, { headers: { "x-admin-secret": "huskd-admin-2026" } })
      .then(r => r.json())
      .then(d => setEntries(d.entries || []))
      .catch(() => {})
  }, [selectedModel, authed, message])

  const handleAdd = async () => {
    if (!selectedModel || !amount || !date) return
    setLoading(true)
    const res = await fetch("/api/admin/earnings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": "huskd-admin-2026" },
      body: JSON.stringify({ userId: selectedModel, date, amount: parseFloat(amount), platform }),
    })
    const data = await res.json()
    setMessage(data.success ? `✅ Добавлено $${amount} за ${date}` : `❌ ${data.error}`)
    setAmount("")
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await fetch("/api/admin/earnings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-secret": "huskd-admin-2026" },
      body: JSON.stringify({ id }),
    })
    setMessage("Удалено")
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm glass-gold rounded-2xl p-8">
          <h1 className="mb-4 text-xl font-bold text-foreground">Admin Panel</h1>
          <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="Пароль" className="mb-3 w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm" onKeyDown={e => e.key === "Enter" && handleAuth()} />
          <button onClick={handleAuth} className="w-full rounded-full bg-gold-gradient py-3 text-sm font-semibold text-background">Войти</button>
          {message && <p className="mt-2 text-sm text-destructive">{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> На главную
        </Link>
        <h1 className="mb-6 text-2xl font-bold text-foreground">📊 Admin — Ввод данных</h1>

        {message && <div className="mb-4 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-sm text-primary">{message}</div>}

        <div className="glass-gold rounded-2xl p-6 mb-6">
          <h2 className="mb-4 text-lg font-semibold">Добавить доход</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Модель</label>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground">
                <option value="">Выберите модель...</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.email} — {m.platformNick || "no nick"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Дата</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Сумма ($)</label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Платформа</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground">
                <option value="chaturbate">Chaturbate</option>
                <option value="stripchat">StripChat</option>
                <option value="bongacams">BongaCams</option>
                <option value="skyprivate">SkyPrivate</option>
                <option value="flirt4free">Flirt4Free</option>
                <option value="xmodels">XModels</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleAdd} disabled={loading} className="w-full rounded-xl bg-gold-gradient py-3 text-sm font-semibold text-background flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Добавить
              </button>
            </div>
          </div>
        </div>

        {selectedModel && entries.length > 0 && (
          <div className="glass-gold rounded-2xl p-6">
            <h2 className="mb-4 text-lg font-semibold">Записи ({entries.length})</h2>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {entries.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-2 border border-white/5">
                  <div>
                    <span className="text-sm font-medium text-foreground">{e.date}</span>
                    <span className="ml-3 text-xs text-muted-foreground">{e.platform}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-emerald-400">${e.amount}</span>
                    <button onClick={() => handleDelete(e.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

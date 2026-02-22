"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Loader2, Search, Users, X, Link2, Percent } from "lucide-react"

interface ModelData {
  id: string; email: string; role: string; platformNick: string; displayName: string;
  totalEarnings: number; recruiterCommission?: number; commissionRate?: number; recruitedBy: string | null; referralCode: string; teacherId?: string | null;
  platformNicks?: Record<string, string>;
}
interface Entry { id: string; date: string; amount: number; platform: string }

export default function AdminPage() {
  const [secret, setSecret] = useState("")
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<"dashboard" | "earnings" | "payouts_model" | "payouts_recruiter" | "network" | "teachers" | "data">("dashboard")
  const [models, setModels] = useState<ModelData[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [entries, setEntries] = useState<Entry[]>([])
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [bulkRows, setBulkRows] = useState([{ date: new Date().toISOString().split("T")[0], amount: "", platform: "chaturbate" }])
  const [bulkLoading, setBulkLoading] = useState(false)

  const headers: Record<string, string> = { "x-admin-secret": "huskd-admin-2026", "Content-Type": "application/json" }

  const handleAuth = () => { if (secret === "huskd-admin-2026") setAuthed(true); else setMessage("Wrong") }

  useEffect(() => {
    if (!authed) return
    fetch("/api/admin/models", { headers }).then(r => r.json()).then(d => setModels(d.models || []))
  }, [authed])

  useEffect(() => {
    if (!selectedModel || !authed) return
    fetch(`/api/admin/earnings?userId=${selectedModel}`, { headers }).then(r => r.json()).then(d => setEntries(d.entries || []))
  }, [selectedModel])

  const handleBulkAdd = async () => {
    const valid = bulkRows.filter(r => r.amount && parseFloat(r.amount) > 0)
    if (!selectedModel || valid.length === 0) return
    setBulkLoading(true)
    for (const row of valid) {
      await fetch("/api/admin/earnings", { method: "POST", headers, body: JSON.stringify({ userId: selectedModel, date: row.date, amount: parseFloat(row.amount), platform: row.platform }) })
    }
    setMessage(`+ ${valid.length} records added`)
    setBulkRows([{ date: new Date().toISOString().split("T")[0], amount: "", platform: "chaturbate" }])
    setBulkLoading(false)
    fetch(`/api/admin/earnings?userId=${selectedModel}`, { headers }).then(r => r.json()).then(d => setEntries(d.entries || []))
  }

  const handleDeleteEntry = async (id: string) => {
    await fetch("/api/admin/earnings", { method: "DELETE", headers, body: JSON.stringify({ id }) })
    fetch(`/api/admin/earnings?userId=${selectedModel}`, { headers }).then(r => r.json()).then(d => setEntries(d.entries || []))
  }

  const handleDeleteAccount = async (userId: string, email: string) => {
    if (!confirm(`Delete ${email}?`)) return
    await fetch("/api/admin/models", { method: "DELETE", headers, body: JSON.stringify({ userId }) })
    setModels(prev => prev.filter(m => m.id !== userId))
    setMessage(`Deleted ${email}`)
    if (selectedModel === userId) setSelectedModel("")
  }

  const addRow = () => { const l = bulkRows[bulkRows.length - 1]; setBulkRows([...bulkRows, { date: l.date, amount: "", platform: l.platform }]) }
  const updateRow = (i: number, f: string, v: string) => { const r = [...bulkRows]; (r[i] as any)[f] = v; setBulkRows(r) }

  const filteredModels = models.filter(m =>
    m.email.toLowerCase().includes(search.toLowerCase()) || (m.platformNick || "").toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))

  const selectedData = models.find(m => m.id === selectedModel)
  const real = models.filter(m => !m.email.includes("demo") && m.email !== "a@gmail.com")

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm glass-gold rounded-2xl p-8">
          <h1 className="mb-2 text-xl font-bold text-foreground">Admin Panel</h1>
          <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="Password" className="mb-3 w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground" onKeyDown={e => e.key === "Enter" && handleAuth()} />
          <button onClick={handleAuth} className="w-full rounded-full bg-gold-gradient py-3 text-sm font-semibold text-background">Enter</button>
          {message && <p className="mt-2 text-sm text-destructive">{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
            <h1 className="text-lg font-bold text-foreground">Admin</h1>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {([
              { id: "dashboard" as const, l: "Obzor" },
              { id: "earnings" as const, l: "Dannye" },
              { id: "payouts_model" as const, l: "Vyplaty modelyam" },
              { id: "payouts_recruiter" as const, l: "Vyplaty rekruteram" },
              { id: "network" as const, l: "Set" },
              { id: "teachers" as const, l: "Teachers" },
              { id: "data" as const, l: "Data" },
            ]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition whitespace-nowrap ${tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{t.l}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {message && (
          <div className="mb-4 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-sm text-primary flex items-center justify-between">
            {message}<button onClick={() => setMessage("")}><X className="h-4 w-4" /></button>
          </div>
        )}

        {tab === "dashboard" && <DashboardTab headers={headers} />}

        {tab === "earnings" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <ModelSelector models={filteredModels} selected={selectedModel} onSelect={setSelectedModel} search={search} onSearch={setSearch} onDelete={handleDeleteAccount} />
              {selectedModel && (
                <>
                  <QuickActions userId={selectedModel} models={models} headers={headers} setMessage={setMessage} onRefresh={() => fetch("/api/admin/models", { headers }).then(r => r.json()).then(d => setModels(d.models || []))} />
                  <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Add earnings - {selectedData?.email}</h3>
                      <button onClick={addRow} className="rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20 flex items-center gap-1"><Plus className="h-3 w-3" /> Row</button>
                    </div>
                    {bulkRows.map((row, i) => (
                      <div key={i} className="flex gap-2 items-center mb-2">
                        <input type="date" value={row.date} onChange={e => updateRow(i, "date", e.target.value)} className="flex-1 rounded-lg border border-border bg-background/50 py-2 px-3 text-sm text-foreground" />
                        <input type="number" step="0.01" value={row.amount} onChange={e => updateRow(i, "amount", e.target.value)} placeholder="$ gross" className="w-28 rounded-lg border border-border bg-background/50 py-2 px-3 text-sm text-foreground" />
                        <select value={row.platform} onChange={e => updateRow(i, "platform", e.target.value)} className="rounded-lg border border-border bg-background/50 py-2 px-2 text-xs text-foreground">
                          {["chaturbate","stripchat","bongacams","skyprivate","flirt4free","xmodels"].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {bulkRows.length > 1 && <button onClick={() => setBulkRows(bulkRows.filter((_, idx) => idx !== i))} className="text-red-400/50 hover:text-red-400"><X className="h-4 w-4" /></button>}
                      </div>
                    ))}
                    <button onClick={handleBulkAdd} disabled={bulkLoading} className="mt-2 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2">
                      {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Entries ({entries.length})</h3>
              {!selectedModel ? <p className="text-xs text-muted-foreground py-8 text-center">Select user</p> :
                entries.length === 0 ? <p className="text-xs text-muted-foreground py-8 text-center">No entries</p> :
                <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto">
                  {entries.map(e => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <div><span className="text-xs text-foreground">{e.date}</span><span className="ml-2 text-[10px] text-muted-foreground uppercase">{e.platform}</span></div>
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

        {tab === "payouts_model" && <PayoutsTab models={models.filter(m => m.role === "model")} headers={headers} setMessage={setMessage} label="model" />}
        {tab === "payouts_recruiter" && <PayoutsTab models={models.filter(m => m.role === "recruiter")} headers={headers} setMessage={setMessage} label="recruiter" isRecruiter />}
        {tab === "network" && <ReferralMap models={models} />}
        {tab === "data" && <DataTab models={models} headers={headers} />}
        {tab === "teachers" && <TeachersTab models={models} headers={headers} setMessage={setMessage} onRefresh={() => fetch("/api/admin/models", { headers }).then(r => r.json()).then(d => setModels(d.models || []))} />}
      </main>
    </div>
  )
}

function DashboardTab({ headers }: { headers: Record<string, string> }) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch("/api/admin/stats", { headers }).then(r => r.json()).then(d => { setStats(d); setLoading(false) }).catch(() => setLoading(false)) }, [])
  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>
  if (!stats) return <div className="text-center py-12 text-muted-foreground">Error</div>
  const maxD = Math.max(...(stats.dailyEarnings?.map((d: any) => d.amount) || [1]))
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SB label="Gross week" value={`$${stats.weekGross}`} />
        <SB label="Gross month" value={`$${stats.monthGross}`} />
        <SB label="Studio 20% week" value={`$${stats.studioWeek}`} color="text-amber-400" />
        <SB label="Studio 20% month" value={`$${stats.studioMonth}`} color="text-amber-400" />
        <SB label="Paid models" value={`$${stats.totalPaidModels}`} color="text-emerald-400" />
        <SB label="Paid recruiters" value={`$${stats.totalPaidRecruiters}`} color="text-blue-400" />
      </div>
      <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Gross 14 days</h3>
        <div className="flex items-end gap-1.5 h-32">
          {stats.dailyEarnings?.map((d: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[8px] text-muted-foreground">{d.amount > 0 ? `$${d.amount}` : ""}</span>
              <div className="w-full rounded-t bg-gradient-to-t from-amber-600 to-amber-400 transition-all" style={{ height: `${Math.max(2, (d.amount / maxD) * 100)}%` }} />
              <span className="text-[8px] text-muted-foreground">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Top models (gross)</h3>
          <div className="flex flex-col gap-1.5">{stats.topModels?.map((m: any, i: number) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
              <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-muted-foreground w-4">{i+1}</span><span className="text-xs text-foreground">{m.email}</span></div>
              <span className="text-sm font-bold text-emerald-400">${m.earnings.toLocaleString()}</span>
            </div>
          ))}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Top recruiters</h3>
          <div className="flex flex-col gap-1.5">{stats.topRecruiters?.map((r: any, i: number) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
              <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-muted-foreground w-4">{i+1}</span><span className="text-xs text-foreground">{r.email}</span><span className="text-[10px] text-blue-400">{r.modelsCount}m {r.rate}%</span></div>
              <span className="text-sm font-bold text-blue-400">${r.commission.toLocaleString()}</span>
            </div>
          ))}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <SB label="Models" value={stats.totalModels} color="text-violet-400" />
        <SB label="Recruiters" value={stats.totalRecruiters} color="text-blue-400" />
        <SB label="Gross all time" value={`$${stats.totalGross?.toLocaleString()}`} color="text-emerald-400" />
      </div>
    </div>
  )
}

function QuickActions({ userId, models, headers, setMessage, onRefresh }: { userId: string; models: ModelData[]; headers: Record<string, string>; setMessage: (m: string) => void; onRefresh: () => void }) {
  const user = models.find(m => m.id === userId)
  const recruiters = models.filter(m => m.role === "recruiter")
  const [selRec, setSelRec] = useState(user?.recruitedBy || "")
  const [comm, setComm] = useState("")
  const [cbUrl, setCbUrl] = useState("")
  const [nicks, setNicks] = useState<Record<string, string>>({})
  const platforms = ["chaturbate","stripchat","bongacams","skyprivate","flirt4free","xmodels"]

  // Reset when user changes
  useEffect(() => {
    const u = models.find(m => m.id === userId)
    if (u) {
      setSelRec(u.recruitedBy || "")
      setCbUrl((u as any).cbStatsUrl || "")
      setNicks(u.platformNicks || {})
    }
  }, [userId, models])

  const link = async () => { await fetch("/api/admin/quick-action", { method: "POST", headers, body: JSON.stringify({ action: "link_recruiter", userId, recruiterId: selRec || null }) }); setMessage(selRec ? "Linked" : "Unlinked"); onRefresh() }
  const setCom = async () => { if (!comm) return; await fetch("/api/admin/quick-action", { method: "POST", headers, body: JSON.stringify({ action: "set_commission", userId, commissionRate: parseInt(comm) }) }); setMessage(`Commission ${comm}%`); onRefresh() }
  const saveCbUrl = async () => { await fetch("/api/admin/quick-action", { method: "POST", headers, body: JSON.stringify({ action: "set_cb_stats_url", userId, url: cbUrl || null }) }); setMessage(cbUrl ? "CB URL saved" : "CB URL removed"); onRefresh() }
  const saveNicks = async () => { await fetch("/api/admin/quick-action", { method: "POST", headers, body: JSON.stringify({ action: "set_nicks", userId, nicks }) }); setMessage("Nicks saved"); onRefresh() }

  if (!user) return null
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
      <h3 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
      <div className="flex flex-col gap-3">
        {user.role === "model" && <div className="flex items-center gap-2"><Link2 className="h-3.5 w-3.5 text-blue-400" /><select value={selRec} onChange={e => setSelRec(e.target.value)} className="rounded-lg border border-border bg-background/50 py-1.5 px-2 text-xs text-foreground"><option value="">No recruiter</option>{recruiters.map(r => <option key={r.id} value={r.id}>{r.email}</option>)}</select><button onClick={link} className="rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-600/30">Link</button></div>}
        {user.role === "recruiter" && <div className="flex items-center gap-2"><Percent className="h-3.5 w-3.5 text-amber-400" /><input type="number" value={comm} onChange={e => setComm(e.target.value)} placeholder="%" className="w-16 rounded-lg border border-border bg-background/50 py-1.5 px-2 text-xs text-foreground" /><button onClick={setCom} className="rounded-lg bg-amber-600/20 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-600/30">Set %</button></div>}
        {user.role === "model" && (
          <>
            <div className="flex items-center gap-2 w-full"><span className="text-[10px] text-orange-400 whitespace-nowrap">CB API:</span><input value={cbUrl} onChange={e => setCbUrl(e.target.value)} placeholder="https://chaturbate.com/statsapi/?username=...&token=..." className="flex-1 rounded-lg border border-border bg-background/50 py-1.5 px-2 text-[10px] text-foreground" /><button onClick={saveCbUrl} className="rounded-lg bg-orange-600/20 px-2 py-1.5 text-[10px] text-orange-400 hover:bg-orange-600/30">Save</button></div>
            <div className="border-t border-white/5 pt-2">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] text-muted-foreground uppercase">Platform Nicks</span><button onClick={saveNicks} className="rounded-lg bg-emerald-600/20 px-2 py-1 text-[10px] text-emerald-400 hover:bg-emerald-600/30">Save nicks</button></div>
              <div className="grid grid-cols-2 gap-1.5">
                {platforms.map(p => (
                  <div key={p} className="flex items-center gap-1"><span className="text-[9px] text-muted-foreground w-12 truncate">{p.slice(0,6)}</span><input value={nicks[p] || ""} onChange={e => setNicks({...nicks, [p]: e.target.value})} placeholder="nick" className="flex-1 rounded border border-border bg-background/50 py-1 px-1.5 text-[10px] text-foreground" /></div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SB({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3"><p className="text-[10px] text-muted-foreground">{label}</p><p className={`text-lg font-bold ${color || "text-foreground"}`}>{value}</p></div>
}

function ModelSelector({ models, selected, onSelect, search, onSearch, onDelete }: { models: ModelData[]; selected: string; onSelect: (id: string) => void; search: string; onSearch: (s: string) => void; onDelete: (id: string, email: string) => void }) {
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
      <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search..." className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm text-foreground" /></div>
      <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
        {models.map(m => {
          const nicks = m.platformNicks || {}; const nl = Object.entries(nicks).filter(([_, v]) => v)
          return (
            <button key={m.id} onClick={() => onSelect(m.id)} className={`flex flex-col rounded-xl px-3 py-2 text-left text-sm transition w-full ${selected === m.id ? "bg-primary/10 border border-primary/20" : "hover:bg-white/[0.03]"}`}>
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-foreground text-xs">{m.email}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${m.role === "model" ? "bg-violet-500/10 text-violet-400" : "bg-blue-500/10 text-blue-400"}`}>{m.role}</span>
                  <span className="text-xs font-bold text-emerald-400">${(m.totalEarnings || 0).toLocaleString()}</span>
                  <button onClick={e => { e.stopPropagation(); onDelete(m.id, m.email) }} className="text-red-400/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              {nl.length > 0 && <div className="flex gap-1.5 mt-1 flex-wrap">{nl.map(([p, n]) => <span key={p} className="text-[9px] text-muted-foreground bg-white/[0.03] rounded px-1 py-0.5">{p}: {n as string}</span>)}</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PayoutsTab({ models, headers, setMessage, label, isRecruiter }: { models: ModelData[]; headers: Record<string, string>; setMessage: (m: string) => void; label: string; isRecruiter?: boolean }) {
  const [selected, setSelected] = useState("")
  const [payouts, setPayouts] = useState<any[]>([])
  const [allPayouts, setAllPayouts] = useState<any[]>([])
  const [payLoading, setPayLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [customPlatform, setCustomPlatform] = useState(isRecruiter ? "commission" : "stripchat")
  const [showAll, setShowAll] = useState(false)
  const platforms = isRecruiter ? ["commission"] : ["chaturbate","stripchat","bongacams","skyprivate","flirt4free","xmodels"]
  const pL: Record<string, string> = { chaturbate: "CB", stripchat: "SC", bongacams: "BC", skyprivate: "SP", flirt4free: "F4F", xmodels: "XM", commission: "Commission" }
  useEffect(() => { if (selected) fetch(`/api/admin/payouts?userId=${selected}`, { headers }).then(r => r.json()).then(d => setPayouts(d.payouts || [])) }, [selected])
  useEffect(() => { if (showAll) fetch(`/api/admin/payouts?all=true`, { headers }).then(r => r.json()).then(d => setAllPayouts(d.payouts || [])) }, [showAll])
  const doPay = async (p: string) => {
    if (!selected) return; setPayLoading(p)
    const amt = customAmount ? parseFloat(customAmount) : undefined
    const res = await fetch("/api/admin/payouts", { method: "POST", headers, body: JSON.stringify({ userId: selected, platform: p, amount: amt }) })
    const d = await res.json()
    if (d.success) { setMessage(`Paid ${pL[p]}: $${d.amount}`); setCustomAmount(""); fetch(`/api/admin/payouts?userId=${selected}`, { headers }).then(r => r.json()).then(d => setPayouts(d.payouts || [])) }
    else setMessage(d.error || "Error")
    setPayLoading(null)
  }
  const delPay = async (id: string) => { await fetch("/api/admin/payouts", { method: "DELETE", headers, body: JSON.stringify({ id }) }); setPayouts(p => p.filter(x => x.id !== id)); setAllPayouts(p => p.filter(x => x.id !== id)); setMessage("Deleted") }
  const filtered = models.filter(m => m.email.toLowerCase().includes(search.toLowerCase()) || (m.platformNick || "").toLowerCase().includes(search.toLowerCase())).sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Select {label}</h3>
          <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm text-foreground" /></div>
          <div className="max-h-64 overflow-y-auto flex flex-col gap-1">{filtered.map(m => (<button key={m.id} onClick={() => setSelected(m.id)} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm w-full ${selected === m.id ? "bg-primary/10 border border-primary/20" : "hover:bg-white/[0.03]"}`}><span className="text-foreground text-xs truncate">{m.email}</span><span className="text-xs font-bold text-emerald-400 ml-2">${(m.recruiterCommission || m.totalEarnings || 0).toLocaleString()}</span></button>))}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
          {!selected ? <p className="text-sm text-muted-foreground py-12 text-center">Select {label}</p> : (
            <>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Payout</h3>
              {isRecruiter && (() => {
                const rec = models.find(m => m.id === selected)
                const comm = rec?.recruiterCommission || 0
                // Subtract existing payouts
                const paid = payouts.reduce((s, p) => s + p.amount, 0)
                const balance = Math.max(0, Math.round((comm - paid) * 100) / 100)
                return (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Balance: <span className="text-emerald-400 font-bold">${balance}</span></span>
                      <span className="text-[10px] text-muted-foreground">Total: ${comm} / Paid: ${paid}</span>
                    </div>
                    <button onClick={() => { if (balance > 0) { setCustomAmount(String(balance)); doPay("commission") } }} disabled={balance <= 0 || payLoading === "auto"} className="w-full rounded-xl bg-blue-600/20 border border-blue-600/30 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-600/30 disabled:opacity-30 transition">Pay ${balance} commission</button>
                  </div>
                )
              })()}
              {!isRecruiter && <div className="grid grid-cols-3 gap-2 mb-4">{platforms.map(p => (<button key={p} onClick={() => doPay(p)} disabled={payLoading === p} className="rounded-xl bg-emerald-600/10 border border-emerald-600/20 px-2 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-600/20 disabled:opacity-50">{payLoading === p ? "..." : pL[p]}</button>))}</div>}
              <div className="flex gap-2 mb-4">
                <input type="number" step="0.01" value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder="$ amount" className="flex-1 rounded-lg border border-border bg-background/50 py-2 px-3 text-sm text-foreground" />
                <select value={customPlatform} onChange={e => setCustomPlatform(e.target.value)} className="rounded-lg border border-border bg-background/50 py-2 px-2 text-xs text-foreground">{platforms.map(p => <option key={p} value={p}>{pL[p]}</option>)}</select>
                <button onClick={() => doPay(customPlatform)} disabled={!customAmount} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">+</button>
              </div>
              {payouts.length > 0 && <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">{payouts.map(p => (<div key={p.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"><div><span className="text-xs text-foreground">{new Date(p.created_at).toLocaleDateString("ru-RU")}</span><span className="ml-2 text-[10px] text-muted-foreground uppercase">{p.platform}</span></div><div className="flex items-center gap-2"><span className="text-sm font-bold text-emerald-400">${p.amount}</span><button onClick={() => delPay(p.id)} className="text-red-400/30 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></div></div>))}</div>}
            </>
          )}
        </div>
      </div>
      <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
        <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-foreground">All payouts</h3><button onClick={() => setShowAll(!showAll)} className="text-xs text-primary hover:underline">{showAll ? "Hide" : "Show"}</button></div>
        {showAll && (allPayouts.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No payouts</p> :
          <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">{allPayouts.map(p => (<div key={p.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"><div className="flex items-center gap-3"><span className="text-xs font-medium text-foreground">{p.userLabel}</span><span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ru-RU")}</span><span className="text-[10px] text-muted-foreground uppercase">{p.platform}</span></div><div className="flex items-center gap-2"><span className="text-sm font-bold text-emerald-400">${p.amount}</span><button onClick={() => delPay(p.id)} className="text-red-400/30 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></div></div>))}</div>)}
      </div>
    </div>
  )
}

function ReferralMap({ models }: { models: ModelData[] }) {
  const recs = models.filter(m => m.role === "recruiter")
  const mods = models.filter(m => m.role === "model")
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
      <h2 className="mb-6 text-lg font-bold text-foreground">Referral Network</h2>
      <div className="flex flex-col items-center gap-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg"><span className="text-xl font-bold text-background">H</span></div>
        <div className="w-full grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recs.map(r => {
            const rm = mods.filter(m => m.recruitedBy === r.id)
            const re = rm.reduce((s, m) => s + (m.totalEarnings || 0), 0)
            return (
              <div key={r.id} className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex items-center gap-3 mb-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400"><Users className="h-5 w-5" /></div><div><p className="text-sm font-bold text-foreground">{r.email}</p><p className="text-[10px] text-muted-foreground">{rm.length} models / ${re.toLocaleString()} gross</p></div></div>
                {rm.length > 0 ? <div className="flex flex-col gap-1.5">{rm.sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0)).map(m => (<div key={m.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-1.5"><span className="text-xs text-foreground">{m.platformNick || m.email}</span><span className="text-xs font-bold text-emerald-400">${(m.totalEarnings || 0).toLocaleString()}</span></div>))}</div> : <p className="text-[11px] text-muted-foreground/50">No models</p>}
              </div>
            )
          })}
          {(() => { const ul = mods.filter(m => !m.recruitedBy); if (!ul.length) return null; return (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3 mb-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-muted-foreground"><Users className="h-5 w-5" /></div><div><p className="text-sm font-bold text-foreground">No recruiter</p><p className="text-[10px] text-muted-foreground">{ul.length} models</p></div></div>
              <div className="flex flex-col gap-1.5">{ul.map(m => (<div key={m.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-1.5"><span className="text-xs text-foreground">{m.platformNick || m.email}</span><span className="text-xs font-bold text-emerald-400">${(m.totalEarnings || 0).toLocaleString()}</span></div>))}</div>
            </div>
          )})()}
        </div>
      </div>
    </div>
  )
}

function DataTab({ models, headers }: { models: ModelData[]; headers: Record<string, string> }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/work-log", { headers }).then(r => r.json()).then(d => { setLogs(d.logs || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  // Group logs by date
  const byDate: Record<string, any[]> = {}
  logs.forEach(l => {
    if (!byDate[l.date]) byDate[l.date] = []
    byDate[l.date].push(l)
  })
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  const getModelName = (uid: string) => {
    const m = models.find(x => x.id === uid)
    return m?.platformNick || m?.email || uid.slice(0, 8)
  }

  const platformColors: Record<string, string> = {
    chaturbate: "bg-orange-500/20 text-orange-400",
    stripchat: "bg-pink-500/20 text-pink-400",
    bongacams: "bg-red-500/20 text-red-400",
    skyprivate: "bg-blue-500/20 text-blue-400",
    flirt4free: "bg-purple-500/20 text-purple-400",
    xmodels: "bg-teal-500/20 text-teal-400",
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-foreground">Work Logs</h2>
      {loading ? <p className="text-xs text-muted-foreground">Loading...</p> : dates.length === 0 ? <p className="text-xs text-muted-foreground">No data yet</p> : (
        <div className="flex flex-col gap-3">
          {dates.map(date => (
            <div key={date} className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
              <h3 className="text-xs font-bold text-muted-foreground mb-3">{date}</h3>
              <div className="flex flex-col gap-2">
                {byDate[date].map((l: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{getModelName(l.user_id)}</span>
                    <div className="flex gap-1.5">
                      {(l.platforms || []).map((p: string) => (
                        <span key={p} className={`rounded-md px-2 py-0.5 text-[9px] font-medium ${platformColors[p] || "bg-white/5 text-muted-foreground"}`}>{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TeachersTab({ models, headers, setMessage, onRefresh }: { models: ModelData[]; headers: Record<string, string>; setMessage: (m: string) => void; onRefresh: () => void }) {
  const [sub, setSub] = useState<"model" | "recruiter">("model")
  const [selTeacher, setSelTeacher] = useState("")
  const [selStudent, setSelStudent] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const teachersModel = models.filter(m => (m as any).isTeacher && m.role === "model")
  const teachersRecruiter = models.filter(m => (m as any).isTeacher && m.role === "recruiter")
  const teachers = sub === "model" ? teachersModel : teachersRecruiter
  const students = sub === "model" ? models.filter(m => m.role === "model") : models.filter(m => m.role === "recruiter")

  const promoteToTeacher = async () => {
    if (!newEmail) return
    const user = models.find(m => m.email === newEmail.trim())
    if (!user) { setMessage("User not found"); return }
    if ((sub === "model" && user.role !== "model") || (sub === "recruiter" && user.role !== "recruiter")) { setMessage("Wrong role"); setLoading(false); return }
    setLoading(true)
    await fetch("/api/admin/quick-action", { method: "POST", headers, body: JSON.stringify({ action: "set_teacher", userId: user.id, isTeacher: true }) })
    setMessage(`${newEmail} is now teacher`)
    setNewEmail("")
    setLoading(false)
    onRefresh()
  }

  const linkStudent = async () => {
    if (!selTeacher || !selStudent) return
    setLoading(true)
    await fetch("/api/admin/quick-action", { method: "POST", headers, body: JSON.stringify({ action: "link_teacher", userId: selStudent, teacherId: selTeacher }) })
    setMessage("Linked")
    setSelStudent("")
    setLoading(false)
    onRefresh()
  }

  const unlinkStudent = async (studentId: string) => {
    setLoading(true)
    await fetch("/api/admin/quick-action", { method: "POST", headers, body: JSON.stringify({ action: "link_teacher", userId: studentId, teacherId: null }) })
    setMessage("Unlinked")
    setLoading(false)
    onRefresh()
  }

  // Get students linked to selected teacher
  const linkedStudents = selTeacher ? models.filter(m => (m as any).teacherId === selTeacher) : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <button onClick={() => { setSub("model"); setSelTeacher("") }} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${sub === "model" ? "bg-violet-500/20 text-violet-400" : "text-muted-foreground hover:text-foreground"}`}>Teacher Models (8%)</button>
        <button onClick={() => { setSub("recruiter"); setSelTeacher("") }} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${sub === "recruiter" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-foreground"}`}>Teacher Recruiters (2%)</button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Create/select teacher */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Make teacher</h3>
            <div className="flex gap-2">
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user email" className="flex-1 rounded-lg border border-border bg-background/50 py-2 px-3 text-sm text-foreground" />
              <button onClick={promoteToTeacher} disabled={loading} className="rounded-lg bg-primary/20 px-4 py-2 text-xs text-primary hover:bg-primary/30">Promote</button>
            </div>
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Teachers ({teachers.length})</h3>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {teachers.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No teachers yet</p> :
                teachers.map(t => (
                  <button key={t.id} onClick={() => setSelTeacher(t.id)} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm w-full ${selTeacher === t.id ? "bg-primary/10 border border-primary/20" : "hover:bg-white/[0.03]"}`}>
                    <span className="text-foreground text-xs">{t.email}</span>
                  </button>
                ))
              }
            </div>
          </div>
        </div>

        {/* Right: Link students */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
          {!selTeacher ? <p className="text-sm text-muted-foreground py-12 text-center">Select teacher</p> : (
            <>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Link {sub === "model" ? "model" : "recruiter"}</h3>
              <div className="flex gap-2 mb-4">
                <select value={selStudent} onChange={e => setSelStudent(e.target.value)} className="flex-1 rounded-lg border border-border bg-background/50 py-2 px-2 text-xs text-foreground">
                  <option value="">Select...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.email}</option>)}
                </select>
                <button onClick={linkStudent} disabled={!selStudent || loading} className="rounded-lg bg-emerald-600/20 px-4 py-2 text-xs text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-30">Link</button>
              </div>

              <h4 className="mb-2 text-xs text-muted-foreground">Linked students</h4>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {linkedStudents.length === 0 ? <p className="text-[11px] text-muted-foreground/50 py-2">None</p> :
                  linkedStudents.map(s => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <span className="text-xs text-foreground">{s.email}</span>
                      <button onClick={() => unlinkStudent(s.id)} className="text-red-400/30 hover:text-red-400 text-[10px]">Unlink</button>
                    </div>
                  ))
                }
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

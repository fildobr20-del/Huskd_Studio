"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Users, DollarSign, StickyNote, Save, Loader2, Edit3 } from "lucide-react"

const PLATFORMS = ["chaturbate","stripchat","bongacams","skyprivate","flirt4free","xmodels"]

export default function TeacherModelDashboard() {
  const [students, setStudents] = useState<any[]>([])
  const [totalCommission, setTotalCommission] = useState(0)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingNicks, setEditingNicks] = useState<string | null>(null)
  const [nickEdit, setNickEdit] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const res = await fetch("/api/teacher")
      if (!res.ok) { router.push("/"); return }
      const data = await res.json()
      if (data.role !== "teacher_model") { router.push("/"); return }

      setNotes(data.notes || "")
      setStudents(data.students || [])
      setTotalCommission(Math.round((data.students || []).reduce((s: number, m: any) => s + m.earnings, 0) * 0.08 * 100) / 100)
      setLoading(false)
    }
    load()
  }, [])

  const saveNotes = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from("profiles").update({ teacher_notes: notes }).eq("id", user.id)
    setSaving(false)
  }

  const startEditNicks = (student: any) => { setEditingNicks(student.id); setNickEdit(student.nicks || {}) }

  const saveStudentNicks = async (studentId: string) => {
    const primaryNick = nickEdit.chaturbate || nickEdit.stripchat || nickEdit.bongacams || Object.values(nickEdit).find(v => v) || ""
    await supabase.from("profiles").update({ platform_nicks: nickEdit, platform_nick: primaryNick }).eq("id", studentId)
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, nicks: { ...nickEdit }, nick: primaryNick } : s))
    setEditingNicks(null)
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <Link href="/dashboard/model" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-lg font-bold text-foreground">Мои ученицы</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-violet-400" /><span className="text-xs text-muted-foreground">Моделей</span></div>
            <p className="text-3xl font-bold text-violet-400">{students.length}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-emerald-400" /><span className="text-xs text-muted-foreground">Мой доход</span></div>
            <p className="text-3xl font-bold text-emerald-400">${totalCommission.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Ученицы</h2>
          {students.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Пока нет учениц</p> : (
            <div className="flex flex-col gap-3">
              {students.sort((a: any, b: any) => b.earnings - a.earnings).map((s: any) => (
                <div key={s.id} className="rounded-xl bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div><span className="text-sm text-foreground">{s.nick || s.email}</span>{s.nick && <span className="ml-2 text-[10px] text-muted-foreground">{s.email}</span>}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-400">${Math.round(s.earnings * 0.08 * 100) / 100}</span>
                      <button onClick={() => editingNicks === s.id ? setEditingNicks(null) : startEditNicks(s)} className="text-muted-foreground hover:text-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {Object.entries(s.nicks || {}).filter(([_, v]) => v).length > 0 && editingNicks !== s.id && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {Object.entries(s.nicks || {}).filter(([_, v]) => v).map(([p, n]) => (
                        <span key={p} className="text-[9px] text-muted-foreground bg-white/[0.03] rounded px-1.5 py-0.5">{p}: {n as string}</span>
                      ))}
                    </div>
                  )}
                  {editingNicks === s.id && (
                    <div className="mt-3 border-t border-white/5 pt-3">
                      <div className="grid grid-cols-2 gap-1.5">
                        {PLATFORMS.map(p => (
                          <div key={p} className="flex items-center gap-1">
                            <span className="text-[9px] text-muted-foreground w-14 truncate">{p}</span>
                            <input value={nickEdit[p] || ""} onChange={e => setNickEdit({...nickEdit, [p]: e.target.value})} placeholder="nick" className="flex-1 rounded border border-border bg-background/50 py-1 px-1.5 text-[10px] text-foreground" />
                          </div>
                        ))}
                      </div>
                      <button onClick={() => saveStudentNicks(s.id)} className="mt-2 w-full rounded-lg bg-emerald-600/20 py-1.5 text-xs text-emerald-400 hover:bg-emerald-600/30">Сохранить ники</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><StickyNote className="h-4 w-4 text-amber-400" /><h2 className="text-sm font-semibold text-foreground">Заметки</h2></div>
            <button onClick={saveNotes} disabled={saving} className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20">{saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Сохранить</button>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} placeholder="Заметки про учениц..." className="w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground resize-none" />
        </div>
      </main>
    </div>
  )
}

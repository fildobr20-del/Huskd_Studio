"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Users, DollarSign, StickyNote, Save, Loader2, UserPlus } from "lucide-react"

export default function TeacherRecruiterDashboard() {
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [totalCommission, setTotalCommission] = useState(0)
  const [totalModels, setTotalModels] = useState(0)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push("/login"); return }
      const { data: profile } = await supabase.from("profiles").select("role, is_teacher, teacher_notes").eq("id", u.id).single()
      if (!profile?.is_teacher || profile?.role !== "recruiter") { router.push("/"); return }
      setUser(u)
      setNotes(profile?.teacher_notes || "")
      const { data: myRecruiters } = await supabase.from("profiles").select("id, email").eq("teacher_id", u.id).eq("role", "recruiter")
      const { data: allModels } = await supabase.from("profiles").select("id, recruited_by, total_lifetime_earnings").eq("role", "model")
      const models = allModels || []
      let grandTotal = 0; let grandModels = 0
      const data = (myRecruiters || []).map(r => {
        const rm = models.filter(m => m.recruited_by === r.id)
        const gross = rm.reduce((s, m) => s + (m.total_lifetime_earnings || 0), 0)
        const my = Math.round(gross * 0.02 * 100) / 100
        grandTotal += my; grandModels += rm.length
        return { id: r.id, email: r.email, modelsCount: rm.length, gross: Math.round(gross * 100) / 100, my }
      })
      setStudents(data); setTotalCommission(Math.round(grandTotal * 100) / 100); setTotalModels(grandModels)
      setLoading(false)
    }
    load()
  }, [])

  const saveNotes = async () => { if (!user) return; setSaving(true); await supabase.from("profiles").update({ teacher_notes: notes }).eq("id", user.id); setSaving(false) }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 py-3">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <Link href="/dashboard/recruiter" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-lg font-bold text-foreground">Мои ученики</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-blue-400" /><span className="text-xs text-muted-foreground">Учеников</span></div>
            <p className="text-3xl font-bold text-blue-400">{students.length}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-1"><UserPlus className="h-4 w-4 text-violet-400" /><span className="text-xs text-muted-foreground">Их моделей</span></div>
            <p className="text-3xl font-bold text-violet-400">{totalModels}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-emerald-400" /><span className="text-xs text-muted-foreground">Мой доход</span></div>
            <p className="text-3xl font-bold text-emerald-400">${totalCommission.toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Ученики-рекрутеры</h2>
          {students.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Пока нет учеников</p> : (
            <div className="flex flex-col gap-2">
              {students.sort((a, b) => b.my - a.my).map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3">
                  <div><span className="text-sm text-foreground">{s.email}</span><span className="ml-2 text-[10px] text-muted-foreground">{s.modelsCount} моделей</span></div>
                  <div className="text-right"><span className="text-sm font-bold text-emerald-400">${s.my}</span><span className="ml-2 text-[10px] text-muted-foreground">(${s.gross} gross)</span></div>
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
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} placeholder="Заметки про учеников..." className="w-full rounded-xl border border-border bg-background/50 py-3 px-4 text-sm text-foreground resize-none" />
        </div>
      </main>
    </div>
  )
}

import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { RecruiterContent } from "./content"

export default async function RecruiterDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "recruiter") redirect("/dashboard/model")
  return <div data-theme="recruiter" className="contents"><RecruiterContent /></div>
}

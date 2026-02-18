import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { RecruiterContent } from "./content"

export default async function RecruiterDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ghost?: string }>
}) {
  const params = await searchParams
  const ghostId = params.ghost

  // Ghost mode — skip role check
  if (ghostId) {
    return <div data-theme="recruiter" className="contents"><RecruiterContent /></div>
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "recruiter") redirect("/dashboard/model")
  return <div data-theme="recruiter" className="contents"><RecruiterContent /></div>
}

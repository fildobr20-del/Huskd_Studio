import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ModelContent } from "./content"

export default async function ModelDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ghost?: string }>
}) {
  const params = await searchParams
  const ghostId = params.ghost

  // Ghost mode — skip role check
  if (ghostId) {
    return <ModelContent />
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return <ModelContent />
}

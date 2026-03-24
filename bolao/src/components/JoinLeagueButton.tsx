'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  leagueId: string
  leagueSlug: string
}

export function JoinLeagueButton({ leagueId, leagueSlug }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function join() {
    setLoading(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    await supabase.from('league_members').insert({ league_id: leagueId, user_id: user.id })
    router.push(`/liga/${leagueSlug}`)
  }

  return (
    <button onClick={join} disabled={loading} className="btn-primary w-full">
      {loading ? 'Entrando...' : 'Entrar no bolão'}
    </button>
  )
}

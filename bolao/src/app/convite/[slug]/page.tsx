import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { JoinLeagueButton } from '@/components/JoinLeagueButton'
import { Users, Trophy } from 'lucide-react'
import { LeagueWithCount } from '@/types/database'

interface Props {
  params: { slug: string }
}

export default async function ConvitePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: league } = await supabase
    .from('leagues')
    .select('*, league_members(count)')
    .eq('slug', params.slug)
    .single() as { data: LeagueWithCount | null }

  if (!league) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card text-center max-w-sm">
          <p className="text-gray-400">Bolão não encontrado.</p>
        </div>
      </main>
    )
  }

  // Se já é membro, vai direto
  if (user) {
    const { data: membership } = await supabase
      .from('league_members')
      .select('*')
      .eq('league_id', league.id)
      .eq('user_id', user.id)
      .single()

    if (membership) redirect(`/liga/${league.slug}`)
  }

  const membersCount = league.league_members?.[0]?.count ?? 0

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm text-center">
        <div className="text-5xl mb-4">⚽</div>
        <h1 className="text-2xl font-black mb-2">Você foi convidado!</h1>
        <p className="text-gray-400 text-sm mb-6">
          Entre no bolão e dispute o ranking com sua turma.
        </p>

        <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-yellow-400" />
            <span className="font-bold">{league.name}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <Users size={12} />
            <span>{membersCount} membro{membersCount !== 1 ? 's' : ''} · Temporada {league.season}</span>
          </div>
        </div>

        {user ? (
          <JoinLeagueButton leagueId={league.id} leagueSlug={league.slug} />
        ) : (
          <a
            href={`/login?next=/convite/${league.slug}`}
            className="btn-primary w-full block"
          >
            Entrar com Google para participar
          </a>
        )}
      </div>
    </main>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trophy, Users } from 'lucide-react'
import { Profile, League } from '@/types/database'

interface LeagueRow extends League {
  league_members: { count: number }[]
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: ownedLeagues },
    { data: memberLeagues },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('leagues')
      .select('*, league_members(count)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: LeagueRow[] | null }>,
    supabase
      .from('league_members')
      .select('league:leagues(*, league_members(count))')
      .eq('user_id', user.id) as unknown as Promise<{ data: { league: LeagueRow }[] | null }>,
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: Profile | null }>,
  ])

  // Filtrar ligas onde não é dono
  const otherLeagues = (memberLeagues ?? [])
    .map(m => m.league)
    .filter((l): l is LeagueRow => !!l && l.owner_id !== user.id)

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Meus Bolões</h1>
          <p className="text-gray-400 text-sm">Olá, {profile?.name?.split(' ')[0] ?? 'amigo'}</p>
        </div>
        <Link href="/liga/nova" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={16} />
          Novo bolão
        </Link>
      </header>

      {ownedLeagues && ownedLeagues.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Criados por mim</h2>
          <div className="flex flex-col gap-3">
            {ownedLeagues.map(league => (
              <LeagueCard key={league.id} league={league} isOwner />
            ))}
          </div>
        </section>
      )}

      {otherLeagues.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Participo</h2>
          <div className="flex flex-col gap-3">
            {otherLeagues.map(league => (
              <LeagueCard key={league.id} league={league} isOwner={false} />
            ))}
          </div>
        </section>
      )}

      {!ownedLeagues?.length && !otherLeagues.length && (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">⚽</div>
          <h3 className="font-bold text-lg mb-2">Nenhum bolão ainda</h3>
          <p className="text-gray-400 text-sm mb-6">Crie seu primeiro bolão e chame os amigos!</p>
          <Link href="/liga/nova" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} />
            Criar bolão
          </Link>
        </div>
      )}
    </main>
  )
}

function LeagueCard({ league, isOwner }: { league: LeagueRow; isOwner: boolean }) {
  const membersCount = league.league_members?.[0]?.count ?? 0

  return (
    <Link href={`/liga/${league.slug}`} className="card hover:border-green-700 transition-colors flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={16} className="text-yellow-400" />
          <span className="font-bold">{league.name}</span>
          {isOwner && (
            <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">Dono</span>
          )}
          {!league.paid && (
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">Free</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-sm">
          <Users size={12} />
          <span>{membersCount} membro{membersCount !== 1 ? 's' : ''}</span>
          <span className="mx-1">·</span>
          <span>Temporada {league.season}</span>
        </div>
      </div>
      <span className="text-gray-600 text-lg">›</span>
    </Link>
  )
}

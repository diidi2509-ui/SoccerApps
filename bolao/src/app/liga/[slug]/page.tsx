import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ShareButton } from '@/components/ShareButton'
import { RankingTable } from '@/components/RankingTable'
import { RoundsList } from '@/components/RoundsList'
import { PaywallBanner } from '@/components/PaywallBanner'
import { RoundShareCard } from '@/components/RoundShareCard'
import { Trophy, Users, Settings } from 'lucide-react'
import { RankingEntry, Round, Match } from '@/types/database'

interface RoundWithMatches extends Round {
  matches: Match[]
}

interface Props {
  params: { slug: string }
  searchParams: { payment?: string }
}

export default async function LeaguePage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!league) notFound()

  const { data: membership } = await supabase
    .from('league_members')
    .select('*')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect(`/convite/${params.slug}`)

  const isOwner = league.owner_id === user.id

  const { data: members } = await supabase
    .from('league_members')
    .select('*, profile:profiles(*)')
    .eq('league_id', league.id)

  const { data: ranking } = await supabase
    .from('league_ranking')
    .select('*')
    .eq('league_id', league.id)
    .order('position', { ascending: true })

  const { data: rounds } = await supabase
    .from('rounds')
    .select('*, matches(*)')
    .eq('league_id', league.id)
    .order('start_date', { ascending: false }) as unknown as { data: RoundWithMatches[] | null }

  // Rodada mais recente aberta ou encerrada para card de compartilhamento
  const activeRound = rounds?.find(r => r.status === 'open' || r.status === 'finished')

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/convite/${league.slug}`

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Toast de pagamento */}
      {searchParams.payment === 'success' && (
        <div className="mb-6 bg-green-900/50 border border-green-700 rounded-xl px-4 py-3 text-green-300 text-sm font-semibold">
          Premium ativado! Obrigado pela assinatura.
        </div>
      )}

      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={20} className="text-yellow-400" />
              <h1 className="text-2xl font-black">{league.name}</h1>
              {league.paid && (
                <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">Premium</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Users size={14} />
              <span>{members?.length ?? 0} participantes · Temporada {league.season}</span>
            </div>
          </div>
          {isOwner && (
            <Link href={`/liga/${league.slug}/admin`} className="text-gray-500 hover:text-white transition-colors p-1">
              <Settings size={20} />
            </Link>
          )}
        </div>

        <div className="mt-4 flex gap-3 flex-wrap">
          <ShareButton
            url={inviteUrl}
            message={`Entre no meu bolão "${league.name}" e dispute o ranking comigo! `}
          />
        </div>
      </header>

      {/* Paywall — só para o dono e apenas se não pagou */}
      {isOwner && !league.paid && (
        <div className="mb-6">
          <PaywallBanner leagueId={league.id} />
        </div>
      )}

      {/* Card compartilhável do ranking */}
      {ranking && ranking.length > 0 && activeRound && (
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-4">Compartilhar ranking</h2>
          <RoundShareCard
            leagueName={league.name}
            roundName={activeRound.name}
            ranking={ranking as RankingEntry[]}
          />
        </div>
      )}

      {/* Rodadas */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Rodadas</h2>
          {isOwner && (
            <Link href={`/liga/${league.slug}/admin/rodada/nova`} className="text-green-400 text-sm hover:underline">
              + Nova rodada
            </Link>
          )}
        </div>
        <RoundsList rounds={rounds ?? []} leagueSlug={league.slug} userId={user.id} />
      </section>

      {/* Ranking */}
      <section>
        <h2 className="font-bold text-lg mb-4">Ranking</h2>
        <RankingTable ranking={(ranking ?? []) as RankingEntry[]} currentUserId={user.id} />
      </section>
    </main>
  )
}

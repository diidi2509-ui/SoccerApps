import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ShareButton } from '@/components/ShareButton'
import { RankingTable } from '@/components/RankingTable'
import { RoundsList } from '@/components/RoundsList'
import { Trophy, Users, Settings } from 'lucide-react'

interface Props {
  params: { slug: string }
}

export default async function LeaguePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!league) notFound()

  // Checa se usuário é membro
  const { data: membership } = await supabase
    .from('league_members')
    .select('*')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .single()

  const isOwner = league.owner_id === user.id

  // Se não é membro, redireciona para entrar
  if (!membership) {
    redirect(`/convite/${params.slug}`)
  }

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
    .order('start_date', { ascending: false })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/convite/${league.slug}`

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={20} className="text-yellow-400" />
              <h1 className="text-2xl font-black">{league.name}</h1>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Users size={14} />
              <span>{members?.length ?? 0} participantes · Temporada {league.season}</span>
            </div>
          </div>
          {isOwner && (
            <Link href={`/liga/${league.slug}/admin`} className="text-gray-500 hover:text-white transition-colors">
              <Settings size={20} />
            </Link>
          )}
        </div>

        {/* Botão compartilhar */}
        <div className="mt-4 flex gap-3">
          <ShareButton
            url={inviteUrl}
            message={`Entre no meu bolão "${league.name}" e dispute o ranking comigo! `}
          />
        </div>
      </header>

      {/* Rodadas abertas */}
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
        <RankingTable ranking={ranking ?? []} currentUserId={user.id} />
      </section>
    </main>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { AdminRoundCard } from '@/components/AdminRoundCard'
import { Round, Match, League } from '@/types/database'

interface RoundWithMatches extends Round {
  matches: Match[]
}

interface Props {
  params: { slug: string }
}

export default async function AdminPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('slug', params.slug)
    .eq('owner_id', user.id)
    .single() as unknown as { data: League | null }

  if (!league) notFound()

  const { data: rounds } = await supabase
    .from('rounds')
    .select('*, matches(*)')
    .eq('league_id', league.id)
    .order('start_date', { ascending: false }) as unknown as { data: RoundWithMatches[] | null }

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link href={`/liga/${params.slug}`} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
        <ArrowLeft size={14} />
        Voltar para {league.name}
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Admin</h1>
          <p className="text-gray-400 text-sm">{league.name}</p>
        </div>
        <Link href={`/liga/${params.slug}/admin/rodada/nova`} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={14} />
          Nova rodada
        </Link>
      </div>

      {rounds && rounds.length > 0 ? (
        <div className="flex flex-col gap-4">
          {(rounds as RoundWithMatches[]).map((round) => (
            <AdminRoundCard key={round.id} round={round} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-10">
          <p className="text-gray-500 mb-4">Nenhuma rodada criada ainda.</p>
          <Link href={`/liga/${params.slug}/admin/rodada/nova`} className="btn-primary inline-flex items-center gap-2">
            <Plus size={14} />
            Criar primeira rodada
          </Link>
        </div>
      )}
    </main>
  )
}

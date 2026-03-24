import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PredictionsForm } from '@/components/PredictionsForm'
import { RoundResultsView } from '@/components/RoundResultsView'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: { slug: string; roundId: string }
}

export default async function RoundPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!league) notFound()

  const { data: round } = await supabase
    .from('rounds')
    .select('*, matches(*)')
    .eq('id', params.roundId)
    .eq('league_id', league.id)
    .single()

  if (!round) notFound()

  // Palpites do usuário nessa rodada
  const matchIds = round.matches.map((m: any) => m.id)
  const { data: myPredictions } = await supabase
    .from('predictions')
    .select('*')
    .in('match_id', matchIds)
    .eq('user_id', user.id)

  const predictionMap = Object.fromEntries(
    (myPredictions ?? []).map(p => [p.match_id, p])
  )

  const isOpen = round.status === 'open'
  const isFinished = round.status === 'finished'

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link href={`/liga/${params.slug}`} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
        <ArrowLeft size={14} />
        Voltar para {league.name}
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-black mb-1">{round.name}</h1>
        <p className="text-gray-500 text-sm">
          {format(new Date(round.start_date), "d 'de' MMM", { locale: ptBR })} –{' '}
          {format(new Date(round.end_date), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
        </p>
        {isOpen && (
          <p className="text-green-400 text-sm font-semibold mt-1">Rodada aberta — dê seus palpites!</p>
        )}
        {round.status === 'closed' && (
          <p className="text-yellow-400 text-sm font-semibold mt-1">Palpites encerrados. Aguardando resultados.</p>
        )}
        {isFinished && (
          <p className="text-gray-400 text-sm font-semibold mt-1">Rodada finalizada.</p>
        )}
      </header>

      {isOpen ? (
        <PredictionsForm
          matches={round.matches}
          predictionMap={predictionMap}
          userId={user.id}
        />
      ) : (
        <RoundResultsView
          matches={round.matches}
          predictionMap={predictionMap}
          isFinished={isFinished}
        />
      )}
    </main>
  )
}

import { Round, Match } from '@/types/database'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RoundWithMatches extends Round {
  matches: Match[]
}

interface Props {
  rounds: RoundWithMatches[]
  leagueSlug: string
  userId: string
}

const statusLabel: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'Em breve', color: 'text-gray-400 bg-gray-800' },
  open: { label: 'Aberta', color: 'text-green-400 bg-green-900/40' },
  closed: { label: 'Encerrada', color: 'text-yellow-400 bg-yellow-900/40' },
  finished: { label: 'Finalizada', color: 'text-gray-500 bg-gray-800' },
}

export function RoundsList({ rounds, leagueSlug }: Omit<Props, 'userId'> & { userId?: string }) {
  if (!rounds.length) {
    return <p className="text-gray-500 text-sm">Nenhuma rodada criada ainda.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {rounds.map((round) => {
        const st = statusLabel[round.status] ?? statusLabel.upcoming
        return (
          <Link
            key={round.id}
            href={`/liga/${leagueSlug}/rodada/${round.id}`}
            className="card hover:border-green-700 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold">{round.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.color}`}>
                  {st.label}
                </span>
              </div>
              <p className="text-gray-500 text-xs">
                {format(new Date(round.start_date), "d MMM", { locale: ptBR })} –{' '}
                {format(new Date(round.end_date), "d MMM", { locale: ptBR })} · {round.matches.length} jogos
              </p>
            </div>
            <span className="text-gray-600 text-lg">›</span>
          </Link>
        )
      })}
    </div>
  )
}

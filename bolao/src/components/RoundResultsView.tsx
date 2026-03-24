import { Match, Prediction } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

interface Props {
  matches: Match[]
  predictionMap: Record<string, Prediction>
  isFinished: boolean
}

function getResult(home: number, away: number): 'home' | 'draw' | 'away' {
  if (home > away) return 'home'
  if (home === away) return 'draw'
  return 'away'
}

export function RoundResultsView({ matches, predictionMap, isFinished }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {matches
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
        .map((match) => {
          const pred = predictionMap[match.id]
          const hasResult = match.home_score !== null && match.away_score !== null
          const points = pred?.points

          let pointsLabel = ''
          let pointsColor = 'text-gray-500'
          if (isFinished && pred) {
            if (points === 3) { pointsLabel = '+3 pts'; pointsColor = 'text-green-400' }
            else if (points === 1) { pointsLabel = '+1 pt'; pointsColor = 'text-yellow-400' }
            else { pointsLabel = '0 pts'; pointsColor = 'text-gray-500' }
          }

          return (
            <div key={match.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs">
                  {format(new Date(match.match_date), "EEE, d 'de' MMM", { locale: ptBR })}
                </p>
                {pointsLabel && (
                  <span className={clsx('text-xs font-bold', pointsColor)}>{pointsLabel}</span>
                )}
              </div>

              {/* Resultado real */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 text-right">
                  <p className="font-bold text-sm">{match.home_team}</p>
                  {match.home_flag && <span className="text-xl">{match.home_flag}</span>}
                </div>
                <div className="text-center">
                  {hasResult ? (
                    <span className="text-2xl font-black">{match.home_score} × {match.away_score}</span>
                  ) : (
                    <span className="text-gray-600 text-lg">? × ?</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm">{match.away_team}</p>
                  {match.away_flag && <span className="text-xl">{match.away_flag}</span>}
                </div>
              </div>

              {/* Seu palpite */}
              {pred ? (
                <div className="bg-gray-800 rounded-lg px-3 py-2 text-center text-sm text-gray-400">
                  Seu palpite:{' '}
                  <span className={clsx('font-bold', points === 3 ? 'text-green-400' : points === 1 ? 'text-yellow-400' : 'text-gray-300')}>
                    {pred.home_score} × {pred.away_score}
                  </span>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg px-3 py-2 text-center text-sm text-gray-600">
                  Sem palpite
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}

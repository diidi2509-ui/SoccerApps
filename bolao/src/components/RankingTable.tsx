import { RankingEntry } from '@/types/database'

interface Props {
  ranking: RankingEntry[]
  currentUserId: string
}

const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function RankingTable({ ranking, currentUserId }: Props) {
  if (!ranking.length) {
    return <p className="text-gray-500 text-sm">Nenhum palpite ainda. A diversão começa quando a rodada abrir!</p>
  }

  return (
    <div className="card p-0 overflow-hidden">
      {ranking.map((entry) => (
        <div
          key={entry.user_id}
          className={`flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0 ${
            entry.user_id === currentUserId ? 'bg-green-950/40' : ''
          }`}
        >
          <span className="w-8 text-center text-sm font-bold text-gray-500">
            {medals[entry.position] ?? entry.position}
          </span>
          <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
            {entry.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                {entry.name[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {entry.name}
              {entry.user_id === currentUserId && <span className="text-green-400 ml-1">(você)</span>}
            </p>
            <p className="text-xs text-gray-500">
              {entry.exact_hits} exatos · {entry.result_hits} resultados
            </p>
          </div>
          <span className="font-black text-lg text-yellow-400">{entry.total_points}</span>
        </div>
      ))}
    </div>
  )
}

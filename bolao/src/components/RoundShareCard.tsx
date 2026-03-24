'use client'

import { useRef, useState } from 'react'
import { RankingEntry } from '@/types/database'
import { Share2, Download } from 'lucide-react'

interface Props {
  leagueName: string
  roundName: string
  ranking: RankingEntry[]
}

const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function RoundShareCard({ leagueName, roundName, ranking }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)

  async function shareCard() {
    setGenerating(true)
    const html2canvas = (await import('html2canvas')).default
    if (!cardRef.current) return

    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#111827',
      scale: 2,
    })

    const dataUrl = canvas.toDataURL('image/png')
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], 'bolao-ranking.png', { type: 'image/png' })

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Ranking ${leagueName}`,
        text: `Confere o ranking do ${roundName}!`,
      })
    } else {
      // fallback: download
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'bolao-ranking.png'
      a.click()
    }
    setGenerating(false)
  }

  const top5 = ranking.slice(0, 5)

  return (
    <div>
      {/* Card visual (será capturado) */}
      <div
        ref={cardRef}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-5 max-w-sm"
        style={{ fontFamily: 'Inter, Arial, sans-serif' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">⚽</span>
          <div>
            <p className="font-black text-white text-sm">{leagueName}</p>
            <p className="text-gray-500 text-xs">{roundName} · Ranking parcial</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {top5.map((entry) => (
            <div key={entry.user_id} className="flex items-center gap-3">
              <span className="w-6 text-sm">{medals[entry.position] ?? entry.position}</span>
              <span className="flex-1 text-white text-sm font-semibold truncate">{entry.name}</span>
              <span className="text-yellow-400 font-black">{entry.total_points}pts</span>
            </div>
          ))}
        </div>

        <p className="text-gray-700 text-xs mt-4 text-center">bolaoamigos.com.br</p>
      </div>

      <button
        onClick={shareCard}
        disabled={generating}
        className="mt-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
      >
        <Share2 size={14} />
        {generating ? 'Gerando card...' : 'Compartilhar ranking no WhatsApp'}
      </button>
    </div>
  )
}

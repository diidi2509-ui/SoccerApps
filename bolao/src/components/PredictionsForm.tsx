'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Match, Prediction } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check } from 'lucide-react'

interface Props {
  matches: Match[]
  predictionMap: Record<string, Prediction>
  userId: string
}

export function PredictionsForm({ matches, predictionMap, userId }: Props) {
  const supabase = createClient()
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>(() =>
    Object.fromEntries(
      matches.map(m => [
        m.id,
        {
          home: predictionMap[m.id]?.home_score?.toString() ?? '',
          away: predictionMap[m.id]?.away_score?.toString() ?? '',
        },
      ])
    )
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  function setScore(matchId: string, side: 'home' | 'away', value: string) {
    if (!/^\d{0,2}$/.test(value)) return
    setScores(prev => ({ ...prev, [matchId]: { ...prev[matchId], [side]: value } }))
  }

  async function savePrediction(matchId: string) {
    const s = scores[matchId]
    if (s.home === '' || s.away === '') return
    setSaving(prev => ({ ...prev, [matchId]: true }))

    const payload = {
      match_id: matchId,
      user_id: userId,
      home_score: parseInt(s.home),
      away_score: parseInt(s.away),
    }

    if (predictionMap[matchId]) {
      await supabase.from('predictions').update(payload).eq('id', predictionMap[matchId].id)
    } else {
      await supabase.from('predictions').insert(payload)
    }

    setSaving(prev => ({ ...prev, [matchId]: false }))
    setSaved(prev => ({ ...prev, [matchId]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [matchId]: false })), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      {matches
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
        .map((match) => {
          const s = scores[match.id]
          const isSaving = saving[match.id]
          const isSaved = saved[match.id]
          const hasPrediction = s.home !== '' && s.away !== ''

          return (
            <div key={match.id} className="card">
              <p className="text-gray-500 text-xs mb-3">
                {format(new Date(match.match_date), "EEE, d 'de' MMM · HH:mm", { locale: ptBR })}
              </p>
              <div className="flex items-center gap-3">
                {/* Casa */}
                <div className="flex-1 text-right">
                  <p className="font-bold text-sm">{match.home_team}</p>
                  {match.home_flag && <span className="text-xl">{match.home_flag}</span>}
                </div>

                {/* Placar */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={s.home}
                    onChange={e => setScore(match.id, 'home', e.target.value)}
                    onBlur={() => hasPrediction && savePrediction(match.id)}
                    className="w-12 h-12 text-center text-xl font-black input rounded-xl"
                    placeholder="?"
                  />
                  <span className="text-gray-600 font-bold">×</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={s.away}
                    onChange={e => setScore(match.id, 'away', e.target.value)}
                    onBlur={() => hasPrediction && savePrediction(match.id)}
                    className="w-12 h-12 text-center text-xl font-black input rounded-xl"
                    placeholder="?"
                  />
                </div>

                {/* Visitante */}
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm">{match.away_team}</p>
                  {match.away_flag && <span className="text-xl">{match.away_flag}</span>}
                </div>
              </div>

              <div className="flex justify-end mt-3">
                {isSaved ? (
                  <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                    <Check size={12} /> Salvo!
                  </span>
                ) : (
                  <button
                    onClick={() => savePrediction(match.id)}
                    disabled={!hasPrediction || isSaving}
                    className="text-xs text-green-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar palpite'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
    </div>
  )
}

'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Match, Round } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react'

interface RoundWithMatches extends Round {
  matches: Match[]
}

interface Props {
  round: RoundWithMatches
}

const statusOptions = [
  { value: 'upcoming', label: 'Em breve' },
  { value: 'open', label: 'Aberta' },
  { value: 'closed', label: 'Encerrada' },
  { value: 'finished', label: 'Finalizada' },
]

export function AdminRoundCard({ round }: Props) {
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState(round.status)
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>(() =>
    Object.fromEntries(
      round.matches.map(m => [
        m.id,
        { home: m.home_score?.toString() ?? '', away: m.away_score?.toString() ?? '' },
      ])
    )
  )
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  function setScore(matchId: string, side: 'home' | 'away', value: string) {
    if (!/^\d{0,2}$/.test(value)) return
    setScores(prev => ({ ...prev, [matchId]: { ...prev[matchId], [side]: value } }))
  }

  async function saveResults() {
    setSaving(true)
    setSavedMsg('')

    // Atualizar status da rodada
    await supabase.from('rounds').update({ status }).eq('id', round.id)

    // Atualizar placares
    for (const match of round.matches) {
      const s = scores[match.id]
      const homeScore = s.home !== '' ? parseInt(s.home) : null
      const awayScore = s.away !== '' ? parseInt(s.away) : null
      await supabase.from('matches').update({ home_score: homeScore, away_score: awayScore }).eq('id', match.id)
    }

    // Se finalizando, calcular pontos
    if (status === 'finished') {
      await supabase.rpc('calculate_round_points', { p_round_id: round.id })
    }

    setSaving(false)
    setSavedMsg(status === 'finished' ? 'Resultados salvos e pontos calculados!' : 'Salvo!')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="text-left">
          <p className="font-bold">{round.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {format(new Date(round.start_date), "d MMM", { locale: ptBR })} · {round.matches.length} jogos · {statusOptions.find(s => s.value === round.status)?.label}
          </p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {expanded && (
        <div className="mt-4 flex flex-col gap-4">
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Status da rodada</label>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value as Round['status'])}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    status === opt.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Placares */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Resultados dos jogos</label>
            <div className="flex flex-col gap-3">
              {round.matches
                .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
                .map((match) => (
                  <div key={match.id} className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-2">
                      {format(new Date(match.match_date), "EEE d/MM HH:mm", { locale: ptBR })}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-right text-sm font-semibold truncate">
                        {match.home_flag} {match.home_team}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={scores[match.id]?.home ?? ''}
                        onChange={e => setScore(match.id, 'home', e.target.value)}
                        className="w-10 h-10 text-center font-black input rounded-lg text-sm"
                        placeholder="?"
                      />
                      <span className="text-gray-600">×</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={scores[match.id]?.away ?? ''}
                        onChange={e => setScore(match.id, 'away', e.target.value)}
                        className="w-10 h-10 text-center font-black input rounded-lg text-sm"
                        placeholder="?"
                      />
                      <span className="flex-1 text-left text-sm font-semibold truncate">
                        {match.away_team} {match.away_flag}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveResults}
              disabled={saving}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
            >
              {status === 'finished' && <Trophy size={14} />}
              {saving ? 'Salvando...' : status === 'finished' ? 'Finalizar e calcular pontos' : 'Salvar'}
            </button>
            {savedMsg && <span className="text-green-400 text-sm font-semibold">{savedMsg}</span>}
          </div>

          {status === 'finished' && (
            <p className="text-xs text-gray-600">
              Ao finalizar, os pontos serão calculados automaticamente para todos os membros.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

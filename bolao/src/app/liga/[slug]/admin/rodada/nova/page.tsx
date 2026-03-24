'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'

interface MatchInput {
  home_team: string
  away_team: string
  home_flag: string
  away_flag: string
  match_date: string
}

export default function NovaRodadaPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [matches, setMatches] = useState<MatchInput[]>([
    { home_team: '', away_team: '', home_flag: '', away_flag: '', match_date: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addMatch() {
    setMatches(prev => [...prev, { home_team: '', away_team: '', home_flag: '', away_flag: '', match_date: '' }])
  }

  function removeMatch(i: number) {
    setMatches(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateMatch(i: number, field: keyof MatchInput, value: string) {
    setMatches(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: league } = await supabase
      .from('leagues')
      .select('*')
      .eq('slug', slug)
      .eq('owner_id', user.id)
      .single()

    if (!league) { setError('Você não é dono dessa liga.'); setLoading(false); return }

    const { data: round, error: rErr } = await supabase
      .from('rounds')
      .insert({
        league_id: league.id,
        name,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        status: 'open',
      })
      .select()
      .single()

    if (rErr) { setError('Erro ao criar rodada.'); setLoading(false); return }

    const matchRows = matches
      .filter(m => m.home_team && m.away_team && m.match_date)
      .map(m => ({
        round_id: round.id,
        home_team: m.home_team,
        away_team: m.away_team,
        home_flag: m.home_flag || null,
        away_flag: m.away_flag || null,
        match_date: new Date(m.match_date).toISOString(),
      }))

    if (matchRows.length) {
      await supabase.from('matches').insert(matchRows)
    }

    router.push(`/liga/${slug}`)
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black mb-6">Nova rodada</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="card flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Nome da rodada</label>
            <input className="input" placeholder="Ex: Rodada 1 — Fase de Grupos" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2">Início</label>
              <input type="datetime-local" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Encerramento de palpites</label>
              <input type="datetime-local" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Jogos</h2>
            <button type="button" onClick={addMatch} className="flex items-center gap-1 text-green-400 text-sm hover:underline">
              <Plus size={14} /> Adicionar jogo
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {matches.map((m, i) => (
              <div key={i} className="card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-400">Jogo {i + 1}</span>
                  {matches.length > 1 && (
                    <button type="button" onClick={() => removeMatch(i)} className="text-gray-600 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input text-sm" placeholder="Time da casa" value={m.home_team} onChange={e => updateMatch(i, 'home_team', e.target.value)} />
                  <input className="input text-sm" placeholder="Visitante" value={m.away_team} onChange={e => updateMatch(i, 'away_team', e.target.value)} />
                  <input className="input text-sm" placeholder="Bandeira casa (emoji)" value={m.home_flag} onChange={e => updateMatch(i, 'home_flag', e.target.value)} />
                  <input className="input text-sm" placeholder="Bandeira visitante (emoji)" value={m.away_flag} onChange={e => updateMatch(i, 'away_flag', e.target.value)} />
                </div>
                <input type="datetime-local" className="input text-sm" value={m.match_date} onChange={e => updateMatch(i, 'match_date', e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Salvando...' : 'Criar rodada'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancelar
        </button>
      </form>
    </main>
  )
}

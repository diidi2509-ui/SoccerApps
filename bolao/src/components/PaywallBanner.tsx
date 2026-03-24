'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface Props {
  leagueId: string
}

export function PaywallBanner({ leagueId }: Props) {
  const [loading, setLoading] = useState(false)

  async function checkout() {
    setLoading(true)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setLoading(false)
  }

  return (
    <div className="card border-yellow-700/50 bg-yellow-950/20">
      <div className="flex items-start gap-3">
        <Star className="text-yellow-400 shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="font-bold mb-1">Ative o Premium</h3>
          <p className="text-gray-400 text-sm mb-3">
            Por apenas R$ 0,99 por temporada, desbloqueie histórico completo, temas exclusivos e notificações de rodada.
          </p>
          <button
            onClick={checkout}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Redirecionando...' : 'Ativar por R$ 0,99'}
          </button>
        </div>
      </div>
    </div>
  )
}

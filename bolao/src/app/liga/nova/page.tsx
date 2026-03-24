'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function NovaLigaPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const baseSlug = slugify(name)
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

    const { data: league, error: err } = await supabase
      .from('leagues')
      .insert({ name: name.trim(), slug, owner_id: user.id, season: '2026' })
      .select()
      .single()

    if (err) {
      setError('Erro ao criar a liga. Tente novamente.')
      setLoading(false)
      return
    }

    // Dono entra automaticamente como membro
    await supabase.from('league_members').insert({ league_id: league.id, user_id: user.id })

    router.push(`/liga/${league.slug}`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-2xl font-black mb-2">Novo bolão</h1>
        <p className="text-gray-400 text-sm mb-6">Dê um nome ao seu bolão. Você poderá convidar amigos depois.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Nome do bolão</label>
            <input
              className="input"
              placeholder="Ex: Galera do Escritório Copa 2026"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={60}
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
            {loading ? 'Criando...' : 'Criar bolão'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancelar
          </button>
        </form>
      </div>
    </main>
  )
}

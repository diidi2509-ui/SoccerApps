'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card text-center max-w-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-black mb-2">Algo deu errado</h1>
        <p className="text-gray-400 text-sm mb-6">Ocorreu um erro inesperado. Tente novamente.</p>
        <button onClick={reset} className="btn-primary">
          Tentar novamente
        </button>
      </div>
    </main>
  )
}

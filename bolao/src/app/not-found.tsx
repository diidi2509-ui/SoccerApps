import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card text-center max-w-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-black mb-2">Página não encontrada</h1>
        <p className="text-gray-400 text-sm mb-6">O bolão ou página que você procura não existe.</p>
        <Link href="/dashboard" className="btn-primary inline-block">
          Ir para meus bolões
        </Link>
      </div>
    </main>
  )
}

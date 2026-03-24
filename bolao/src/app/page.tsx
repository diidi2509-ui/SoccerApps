import Link from 'next/link'
import { Trophy, Users, Share2, Star } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-6 text-6xl">⚽</div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
          Bolão com a <span className="text-green-400">sua turma</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-10">
          Crie uma liga, chame os amigos pelo WhatsApp e dispute o ranking.
          Palpites de futebol do jeito certo — sem complicação.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login" className="btn-primary text-lg">
            Criar meu bolão grátis
          </Link>
          <Link href="#como-funciona" className="btn-secondary text-lg">
            Como funciona
          </Link>
        </div>
        <p className="mt-4 text-gray-600 text-sm">
          Grátis para começar · Sem necessidade de cartão
        </p>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="px-4 py-16 max-w-4xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '1', title: 'Crie a liga', desc: 'Dê um nome ao seu bolão e defina a temporada.' },
            { icon: '2', title: 'Convide pelo WhatsApp', desc: 'Compartilhe o link. Qualquer pessoa entra em 1 clique.' },
            { icon: '3', title: 'Dê seus palpites', desc: 'Antes de cada rodada, chute os placares e acumule pontos.' },
          ].map((step) => (
            <div key={step.icon} className="card flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-xl font-black">
                {step.icon}
              </div>
              <h3 className="font-bold text-lg">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Por que usar o Bolão Amigos?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: <Trophy size={24} className="text-yellow-400" />, title: 'Ranking automático', desc: 'Placar exato = 3 pontos. Resultado certo = 1 ponto. Calculado na hora.' },
              { icon: <Share2 size={24} className="text-green-400" />, title: 'Card para WhatsApp', desc: 'Gere um card da rodada e cole direto no grupo. Fácil de zoar o amigo.' },
              { icon: <Users size={24} className="text-blue-400" />, title: 'Ligas privadas', desc: 'Cada grupo tem sua própria liga. Firmas, condomínios, família — cada um no seu.' },
              { icon: <Star size={24} className="text-purple-400" />, title: 'R$ 0,99 por temporada', desc: 'Desbloqueie histórico ilimitado, temas e notificações por menos de 1 real.' },
            ].map((feat) => (
              <div key={feat.title} className="card flex gap-4">
                <div className="shrink-0 mt-1">{feat.icon}</div>
                <div>
                  <h3 className="font-bold mb-1">{feat.title}</h3>
                  <p className="text-gray-400 text-sm">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Pronto para o próximo jogo?</h2>
        <p className="text-gray-400 mb-8">Copa 2026 tá chegando. Cria o bolão agora.</p>
        <Link href="/login" className="btn-primary text-lg inline-block">
          Começar agora — é grátis
        </Link>
      </section>

      <footer className="text-center text-gray-700 text-sm py-6 border-t border-gray-800">
        <div className="flex items-center justify-center gap-3">
          <span>Bolao Amigos · Feito para o Brasil</span>
          <Link href="/termos" className="underline hover:text-gray-500">
            Termos
          </Link>
          <Link href="/privacidade" className="underline hover:text-gray-500">
            Privacidade
          </Link>
        </div>
      </footer>
    </main>
  )
}

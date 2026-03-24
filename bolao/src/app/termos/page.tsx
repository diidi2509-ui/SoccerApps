export const metadata = {
  title: 'Termos de Uso | Bolao Amigos',
}

export default function TermosPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-6">Termos de Uso</h1>
      <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <p>
          O Bolao Amigos e uma plataforma de palpites recreativos entre amigos. Nao operamos apostas
          esportivas regulamentadas, nao intermediamo valores apostados e nao garantimos premiacao financeira.
        </p>
        <p>
          O usuario e responsavel pelos conteudos que publica, convites que compartilha e acordos informais
          firmados com terceiros fora da plataforma.
        </p>
        <p>
          Recursos pagos (ex.: Premium por temporada) liberam funcionalidades digitais do produto. Nao representam
          participacao em jogos de azar ou promessa de retorno financeiro.
        </p>
        <p>
          Ao utilizar o servico, voce concorda em respeitar a legislacao aplicavel e a nao usar a plataforma para
          fraudes, assedio, discurso de odio ou atividades ilegais.
        </p>
        <p className="text-gray-500">Ultima atualizacao: 24/03/2026.</p>
      </div>
    </main>
  )
}

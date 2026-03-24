export const metadata = {
  title: 'Politica de Privacidade | Bolao Amigos',
}

export default function PrivacidadePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-6">Politica de Privacidade</h1>
      <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <p>
          Coletamos os dados minimos para operar o servico: identificador do usuario, nome, email, avatar,
          ligas, palpites e eventos de pagamento.
        </p>
        <p>
          Utilizamos esses dados para autenticacao, funcionamento de ligas, ranking, antifraude basico e suporte.
          Nao vendemos dados pessoais.
        </p>
        <p>
          Pagamentos sao processados por provedores terceiros (ex.: Mercado Pago), sujeitos as politicas proprias
          desses provedores.
        </p>
        <p>
          O usuario pode solicitar atualizacao ou exclusao de dados da conta por canal de suporte oficial.
        </p>
        <p className="text-gray-500">Ultima atualizacao: 24/03/2026.</p>
      </div>
    </main>
  )
}

# Bolao Amigos

Aplicacao web de bolao de futebol para ligas privadas (amigos, familia, empresa), com convite via link e ranking automatico.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Auth, Postgres, RLS)
- Mercado Pago (checkout + webhook)
- Tailwind CSS

## Principais fluxos

- Login com Google
- Criacao de liga e convite por link
- Rodadas, jogos e palpites
- Ranking automatico (placar exato = 3, resultado = 1)
- Premium por temporada

## Configuracao de ambiente

Crie `.env.local` com:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
MP_ACCESS_TOKEN=...
MP_WEBHOOK_SECRET=...
# Opcional (se quiser webhook em URL fixa)
MP_WEBHOOK_URL=https://seu-dominio.com/api/webhook/mercadopago
```

## Rodando local

```bash
npm install
npm run dev
```

Aplicacao: `http://localhost:3000`.

## Testes

```bash
npm run test
npm run test:watch
npm run test:coverage
```

## Banco de dados

O schema esta em `supabase/schema.sql`.

Inclui:
- entidades de produto (`leagues`, `rounds`, `matches`, `predictions`)
- view de ranking (`league_ranking`)
- tabela `payment_events` para auditoria e idempotencia de webhook

## Seguranca e compliance (MVP)

- OAuth callback com validacao de redirecionamento interno
- Webhook Mercado Pago com verificacao de assinatura (`x-signature`)
- Idempotencia de pagamento via `payment_events.payment_id` unico
- Paginas de Termos e Privacidade disponiveis em:
  - `/termos`
  - `/privacidade`

## Aviso de produto

Bolao Amigos e produto recreativo de palpites entre amigos. Nao opera casa de apostas, nao intermedia apostas esportivas regulamentadas e nao garante retorno financeiro.

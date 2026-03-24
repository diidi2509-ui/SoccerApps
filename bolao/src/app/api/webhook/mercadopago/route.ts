import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (body.type !== 'payment') {
    return NextResponse.json({ ok: true })
  }

  const paymentId = body.data?.id
  if (!paymentId) return NextResponse.json({ ok: true })

  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  })

  if (!mpResponse.ok) return NextResponse.json({ ok: false }, { status: 500 })

  const payment = await mpResponse.json()

  if (payment.status !== 'approved') {
    return NextResponse.json({ ok: true })
  }

  const [leagueId] = (payment.external_reference ?? '').split('|')
  if (!leagueId) return NextResponse.json({ ok: true })

  // Service role para atualizar sem RLS — criado dentro da função
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase.from('leagues').update({ paid: true }).eq('id', leagueId)

  return NextResponse.json({ ok: true })
}

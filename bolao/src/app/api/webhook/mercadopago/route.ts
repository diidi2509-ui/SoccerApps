import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'

export function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

export function verifyMercadoPagoSignature(request: NextRequest, _rawBody: string, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    // Em produção, recuse webhooks sem segredo configurado.
    return process.env.NODE_ENV !== 'production'
  }

  const signature = request.headers.get('x-signature')
  const requestId = request.headers.get('x-request-id')
  if (!signature || !requestId) return false

  const parts = signature.split(',').reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.trim().split('=')
    if (k && v) acc[k] = v
    return acc
  }, {})

  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  return timingSafeEqual(expected, v1)
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  let body: { type?: string; data?: { id?: string | number } }
  try {
    body = JSON.parse(rawBody) as { type?: string; data?: { id?: string | number } }
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.type !== 'payment') {
    return NextResponse.json({ ok: true })
  }

  const paymentId = body.data?.id
  if (!paymentId) return NextResponse.json({ ok: true })

  if (!verifyMercadoPagoSignature(request, rawBody, String(paymentId))) {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
  }

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

  // Idempotência: registra o evento e evita processar pagamento duplicado.
  const { error: eventError } = await supabase
    .from('payment_events')
    .insert({
      provider: 'mercadopago',
      payment_id: String(paymentId),
      league_id: leagueId,
      status: String(payment.status ?? 'unknown'),
      raw_payload: payment,
    })

  if (eventError && eventError.code !== '23505') {
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  await supabase.from('leagues').update({ paid: true }).eq('id', leagueId)

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { League } from '@/types/database'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { leagueId } = await request.json()

  if (!leagueId) {
    return NextResponse.json({ error: 'leagueId required' }, { status: 400 })
  }

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .eq('owner_id', user.id)
    .single() as { data: League | null }

  if (!league) {
    return NextResponse.json({ error: 'League not found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // Criar preferência no Mercado Pago
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          id: leagueId,
          title: `Bolão Amigos Premium · ${league.name}`,
          quantity: 1,
          unit_price: 0.99,
          currency_id: 'BRL',
        },
      ],
      payer: { email: user.email },
      back_urls: {
        success: `${appUrl}/liga/${league.slug}?payment=success`,
        failure: `${appUrl}/liga/${league.slug}?payment=failure`,
        pending: `${appUrl}/liga/${league.slug}?payment=pending`,
      },
      auto_return: 'approved',
      external_reference: `${leagueId}|${user.id}`,
      statement_descriptor: 'BOLAO AMIGOS',
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'MP error' }, { status: 500 })
  }

  const { init_point } = await response.json()
  return NextResponse.json({ url: init_point })
}

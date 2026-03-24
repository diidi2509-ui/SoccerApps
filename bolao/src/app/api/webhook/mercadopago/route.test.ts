import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}))

function buildSignature(secret: string, paymentId: string, requestId: string, ts = '1710000000') {
  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`
  const v1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  return `ts=${ts},v1=${v1}`
}

function buildRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest('http://localhost:3000/api/webhook/mercadopago', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/webhook/mercadopago', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.MP_WEBHOOK_SECRET = 'test-secret'
    process.env.MP_ACCESS_TOKEN = 'mp-token'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.local'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
  })

  it('returns 401 when signature is invalid', async () => {
    const { POST } = await import('./route')
    const req = buildRequest(
      { type: 'payment', data: { id: '123' } },
      {
        'x-request-id': 'req-1',
        'x-signature': 'ts=1,v1=invalid',
      }
    )

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('processes approved payment and marks league as paid', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    const eqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn(() => ({ eq: eqMock }))
    const fromMock = vi.fn((table: string) => {
      if (table === 'payment_events') return { insert: insertMock }
      if (table === 'leagues') return { update: updateMock }
      return {}
    })

    createClientMock.mockReturnValue({ from: fromMock })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'approved',
          external_reference: 'league-abc|user-1',
        }),
      })
    )

    const requestId = 'req-42'
    const paymentId = '987'
    const signature = buildSignature(process.env.MP_WEBHOOK_SECRET!, paymentId, requestId)
    const req = buildRequest(
      { type: 'payment', data: { id: paymentId } },
      {
        'x-request-id': requestId,
        'x-signature': signature,
      }
    )

    const { POST } = await import('./route')
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(updateMock).toHaveBeenCalledWith({ paid: true })
    expect(eqMock).toHaveBeenCalledWith('id', 'league-abc')
  })
})

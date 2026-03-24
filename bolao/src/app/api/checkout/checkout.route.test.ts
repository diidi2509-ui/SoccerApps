import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const checkoutMocks = vi.hoisted(() => ({
  leagueQueryResult: { data: null as unknown },
  getUser: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: checkoutMocks.getUser },
    from: (table: string) => {
      if (table === 'leagues') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => checkoutMocks.leagueQueryResult,
              }),
            }),
          }),
        }
      }
      return {}
    },
  }),
}))

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    checkoutMocks.leagueQueryResult = { data: null }
    vi.stubGlobal('fetch', vi.fn())
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.MP_ACCESS_TOKEN = 'mp-token'
    delete process.env.MP_WEBHOOK_URL
  })

  function postCheckout(body: unknown) {
    return new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('returns 401 when user is not authenticated', async () => {
    checkoutMocks.getUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('./route')
    const res = await POST(postCheckout({ leagueId: 'l1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when leagueId is missing', async () => {
    checkoutMocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    })
    const { POST } = await import('./route')
    const res = await POST(postCheckout({}))
    expect(res.status).toBe(400)
  })

  it('returns 404 when league is not found or user is not owner', async () => {
    checkoutMocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    })
    checkoutMocks.leagueQueryResult = { data: null }
    const { POST } = await import('./route')
    const res = await POST(postCheckout({ leagueId: 'missing' }))
    expect(res.status).toBe(404)
  })

  it('returns 500 when NEXT_PUBLIC_APP_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    checkoutMocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    })
    checkoutMocks.leagueQueryResult = {
      data: {
        id: 'l1',
        name: 'Test League',
        slug: 'test-league',
        owner_id: 'u1',
        season: '2026',
        paid: false,
        created_at: '',
      },
    }
    const { POST } = await import('./route')
    const res = await POST(postCheckout({ leagueId: 'l1' }))
    expect(res.status).toBe(500)
  })

  it('returns 500 when Mercado Pago preference fails', async () => {
    checkoutMocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    })
    checkoutMocks.leagueQueryResult = {
      data: {
        id: 'l1',
        name: 'Test League',
        slug: 'test-league',
        owner_id: 'u1',
        season: '2026',
        paid: false,
        created_at: '',
      },
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 502,
    } as Response)

    const { POST } = await import('./route')
    const res = await POST(postCheckout({ leagueId: 'l1' }))
    expect(res.status).toBe(500)
  })

  it('returns checkout URL on success', async () => {
    checkoutMocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    })
    checkoutMocks.leagueQueryResult = {
      data: {
        id: 'l1',
        name: 'Test League',
        slug: 'test-league',
        owner_id: 'u1',
        season: '2026',
        paid: false,
        created_at: '',
      },
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ init_point: 'https://mp.test/checkout/xyz' }),
    } as Response)

    const { POST } = await import('./route')
    const res = await POST(postCheckout({ leagueId: 'l1' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ url: 'https://mp.test/checkout/xyz' })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.mercadopago.com/checkout/preferences',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mp-token',
        }),
      })
    )
    const [, init] = vi.mocked(fetch).mock.calls[0]
    const parsed = JSON.parse((init as RequestInit).body as string)
    expect(parsed.notification_url).toBe(
      'http://localhost:3000/api/webhook/mercadopago'
    )
    expect(parsed.external_reference).toBe('l1|u1')
    expect(parsed.metadata).toEqual({ league_id: 'l1', owner_id: 'u1' })
  })

  it('uses MP_WEBHOOK_URL when set', async () => {
    process.env.MP_WEBHOOK_URL = 'https://example.com/hook'
    checkoutMocks.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    })
    checkoutMocks.leagueQueryResult = {
      data: {
        id: 'l1',
        name: 'L',
        slug: 'l',
        owner_id: 'u1',
        season: '2026',
        paid: false,
        created_at: '',
      },
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ init_point: 'https://mp.test/pay' }),
    } as Response)

    const { POST } = await import('./route')
    await POST(postCheckout({ leagueId: 'l1' }))
    const [, init] = vi.mocked(fetch).mock.calls[0]
    const parsed = JSON.parse((init as RequestInit).body as string)
    expect(parsed.notification_url).toBe('https://example.com/hook')
  })
})

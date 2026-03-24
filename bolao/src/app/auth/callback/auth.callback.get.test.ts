import { beforeEach, describe, expect, it, vi } from 'vitest'

const exchangeCodeForSession = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      exchangeCodeForSession,
    },
  }),
}))

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to login when code is missing', async () => {
    const { GET } = await import('./route')
    const res = await GET(
      new Request('http://localhost:3000/auth/callback?next=/dashboard')
    )
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=auth_failed')
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('redirects to sanitized next when exchange succeeds', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })
    const { GET } = await import('./route')
    const res = await GET(
      new Request(
        'http://localhost:3000/auth/callback?code=oauth-code&next=%2Fliga%2Fmeu-bolao'
      )
    )
    expect(exchangeCodeForSession).toHaveBeenCalledWith('oauth-code')
    expect(res.headers.get('location')).toBe('http://localhost:3000/liga/meu-bolao')
  })

  it('redirects to login when exchange fails', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: 'invalid' } })
    const { GET } = await import('./route')
    const res = await GET(
      new Request('http://localhost:3000/auth/callback?code=bad')
    )
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=auth_failed')
  })

  it('uses /dashboard when next is unsafe', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })
    const { GET } = await import('./route')
    const res = await GET(
      new Request(
        'http://localhost:3000/auth/callback?code=ok&next=https%3A%2F%2Fevil.com'
      )
    )
    expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard')
  })
})

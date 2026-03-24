import { describe, expect, it } from 'vitest'
import { sanitizeNextPath } from './route'

describe('sanitizeNextPath', () => {
  it('returns dashboard for null or invalid paths', () => {
    expect(sanitizeNextPath(null)).toBe('/dashboard')
    expect(sanitizeNextPath('https://evil.com')).toBe('/dashboard')
    expect(sanitizeNextPath('//evil.com')).toBe('/dashboard')
    expect(sanitizeNextPath('dashboard')).toBe('/dashboard')
  })

  it('keeps valid internal paths', () => {
    expect(sanitizeNextPath('/dashboard')).toBe('/dashboard')
    expect(sanitizeNextPath('/liga/abc?x=1')).toBe('/liga/abc?x=1')
  })
})

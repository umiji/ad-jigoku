import { describe, expect, it } from 'vitest'
import { checkPackage } from './check-deps'

describe('check-deps', () => {
  it('accepts game-engine depending only on pattern-catalog', () => {
    expect(
      checkPackage({ name: '@ad-jigoku/game-engine', dependencies: { '@ad-jigoku/pattern-catalog': 'workspace:*' } }, false),
    ).toEqual([])
  })

  it('rejects game-engine depending on react', () => {
    const v = checkPackage({ name: '@ad-jigoku/game-engine', dependencies: { react: '^19' } }, false)
    expect(v).toHaveLength(1)
    expect(v[0]?.dep).toBe('react')
  })

  it('rejects game-engine depending on ui (direction violation)', () => {
    const v = checkPackage({ name: '@ad-jigoku/game-engine', dependencies: { '@ad-jigoku/ui': 'workspace:*' } }, false)
    expect(v).toHaveLength(1)
  })

  it('rejects any package depending on apps/web', () => {
    const v = checkPackage({ name: '@ad-jigoku/ui', dependencies: { '@ad-jigoku/web': 'workspace:*' } }, false)
    expect(v.map((x) => x.reason)).toContain('packages/* は apps/* に依存できない')
  })

  it('pattern-catalog may depend on zod only', () => {
    expect(checkPackage({ name: '@ad-jigoku/pattern-catalog', dependencies: { zod: '^4' } }, false)).toEqual([])
    expect(checkPackage({ name: '@ad-jigoku/pattern-catalog', dependencies: { lodash: '^4' } }, false)).toHaveLength(1)
    expect(
      checkPackage({ name: '@ad-jigoku/pattern-catalog', dependencies: { '@ad-jigoku/game-engine': '*' } }, false),
    ).toHaveLength(1)
  })

  it('rejects evaluator-core depending on playwright', () => {
    expect(checkPackage({ name: '@ad-jigoku/evaluator-core', dependencies: { playwright: '^1' } }, false)).toHaveLength(1)
  })

  it('rejects ui depending on game-engine', () => {
    expect(
      checkPackage({ name: '@ad-jigoku/ui', dependencies: { '@ad-jigoku/game-engine': 'workspace:*' } }, false).length,
    ).toBeGreaterThan(0)
  })

  it('allows apps/web to depend on the allowed packages', () => {
    expect(
      checkPackage(
        {
          name: '@ad-jigoku/web',
          dependencies: { '@ad-jigoku/pattern-catalog': '*', '@ad-jigoku/game-engine': '*', '@ad-jigoku/ui': '*', next: '15' },
        },
        true,
      ),
    ).toEqual([])
  })
})

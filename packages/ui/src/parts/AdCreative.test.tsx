/**
 * AdCreative — 架空の広告素材を描く（DESIGN.md §8 anatomy / §3 MUST NOT 9 / §17 Imagery）。
 *
 * Creative のデータそのものは TASK-013D が持つ。ここは「描き方」だけを持つ。
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdCreative } from './AdCreative'
import { adCopy } from './copy'
import type { AdPartState, CreativeContent } from './types'

const CREATIVE: CreativeContent = {
  id: 'sale-001',
  kind: 'sale',
  brand: 'ジゴク通販',
  headline: '今だけ90%オフ',
  body: '在庫はあと3点です。',
  cta: '今すぐ受け取る',
  legal: '※ 架空の広告です。',
  theme: 'popup',
}

function partState(part: AdPartState['part'], overrides: Partial<AdPartState> = {}): AdPartState {
  return { part, visible: true, enabled: true, emphasis: 1, hitboxScale: 1, ...overrides }
}

describe('AdCreative', () => {
  it('anatomy（ラベル / 見出し / 本文 / CTA / 極小注意書き）を描く', () => {
    render(<AdCreative creative={CREATIVE} />)
    expect(screen.getByText('今だけ90%オフ')).toBeInTheDocument()
    expect(screen.getByText('在庫はあと3点です。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '今すぐ受け取る' })).toBeInTheDocument()
    expect(screen.getByText('※ 架空の広告です。')).toBeInTheDocument()
    expect(screen.getByText(adCopy.label.pr)).toBeInTheDocument()
  })

  it('legal が無いときは「架空の広告である」ことを既定で明記する（DESIGN §3 MUST NOT 9 / trust）', () => {
    const { legal: _legal, ...withoutLegal } = CREATIVE
    render(<AdCreative creative={withoutLegal} />)
    expect(screen.getByText(adCopy.legal.fiction)).toBeInTheDocument()
  })

  it('theme はトークンの surface / accent の選択であって生の色ではない', () => {
    const { container } = render(<AdCreative creative={{ ...CREATIVE, theme: 'danger' }} />)
    const root = container.firstElementChild
    expect(root).toHaveAttribute('data-ad-theme', 'danger')
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(container.innerHTML).not.toMatch(/rgba?\(/i)
  })

  it('抽象グラフィックは creative.id から決定論的に選ばれる（Math.random を使わない）', () => {
    const first = render(<AdCreative creative={CREATIVE} />)
    const variantA = first.container.firstElementChild?.getAttribute('data-graphic-variant')
    first.unmount()

    const second = render(<AdCreative creative={CREATIVE} />)
    const variantB = second.container.firstElementChild?.getAttribute('data-graphic-variant')

    expect(variantA).not.toBeNull()
    expect(variantA).toBe(variantB)
  })

  it('id が違えば別のバリアントも選ばれる（4 種類が使われている）', () => {
    const ids = ['sale-001', 'notice-002', 'download-003', 'video-004', 'app-005', 'sale-006', 'notice-007', 'x-008']
    const variants = new Set(
      ids.map((id) => {
        const view = render(<AdCreative creative={{ ...CREATIVE, id }} />)
        const variant = view.container.firstElementChild?.getAttribute('data-graphic-variant') ?? ''
        view.unmount()
        return variant
      }),
    )
    expect(variants.size).toBeGreaterThan(1)
    for (const variant of variants) expect(['0', '1', '2', '3']).toContain(variant)
  })

  it('ブランドはタイポグラフィで描く（画像を読み込まない / §17 Imagery）', () => {
    const { container } = render(<AdCreative creative={CREATIVE} />)
    expect(screen.getByText('ジゴク通販')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })

  it('外部リンクを一切持たない（SAFE-05）', () => {
    const { container } = render(<AdCreative creative={CREATIVE} />)
    expect(container.querySelector('a')).toBeNull()
    expect(container.querySelector('[href]')).toBeNull()
  })

  it('ViewState.parts をそのまま渡せる（visible=false の部位は描かれない）', () => {
    render(<AdCreative creative={CREATIVE} parts={[partState('body', { visible: false })]} />)
    expect(screen.queryByText('在庫はあと3点です。')).not.toBeInTheDocument()
    expect(screen.getByText('今だけ90%オフ')).toBeInTheDocument()
  })

  it('CTA の enabled / emphasis も parts から来る', () => {
    render(<AdCreative creative={CREATIVE} parts={[partState('cta', { enabled: false, emphasis: 2 })]} />)
    const cta = screen.getByRole('button', { name: '今すぐ受け取る' })
    expect(cta).toHaveAttribute('aria-disabled', 'true')
    expect(cta).toHaveAttribute('data-emphasis', '2')
  })

  it('部位が押されたら、どの部位かを添えて onPartActivate を呼ぶ', async () => {
    const onPartActivate = vi.fn()
    render(<AdCreative creative={CREATIVE} instanceId="ad-5" onPartActivate={onPartActivate} />)
    await userEvent.click(screen.getByRole('button', { name: '今すぐ受け取る' }))
    expect(onPartActivate).toHaveBeenCalledWith('cta')
  })

  it('countdown を渡すと必ず表示する（GAME §15.4）', () => {
    const { container } = render(<AdCreative creative={CREATIVE} countdown={{ remainingMs: 3000 }} />)
    const root = container.firstElementChild as HTMLElement
    expect(within(root).getByText('あと3秒')).toBeVisible()
  })

  it('instanceId を全ての部位に配る（TASK-014 の intent マッピング）', () => {
    const { container } = render(<AdCreative creative={CREATIVE} instanceId="ad-6" />)
    const targets = container.querySelectorAll('[data-target]')
    expect(targets.length).toBeGreaterThan(0)
    for (const target of targets) expect(target).toHaveAttribute('data-instance', 'ad-6')
  })
})

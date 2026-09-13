/**
 * densityStack — 積み上がる広告（DESIGN.md §9 Layered Ad / chaos。PER-01 / PER-02）。
 *
 * 下敷きのカードは**ただの装飾**。実際の追加レイヤーはエンジンが別インスタンスとして出す（persist:multi-layer）。
 * だから装飾側には操作先も読み上げも無い。
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DensityStack } from './DensityStack'
import { densityStackDescriptor } from './descriptor'
import { partState, shellProps } from '../fixtures'

describe('densityStack', () => {
  it('ラベル / 見出し / 短文 / CTA / × を描く', () => {
    render(<DensityStack {...shellProps()} />)
    expect(screen.getByText('PR')).toBeInTheDocument()
    expect(screen.getByText('本日限り 全品半額')).toBeInTheDocument()
    expect(screen.getByText('在庫がなくなり次第、静かに終了します')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '今すぐ見る' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '広告を閉じる' })).toBeInTheDocument()
  })

  it('下敷きのカードは装飾。支援技術から隠し、操作先も持たない', () => {
    const { container } = render(<DensityStack {...shellProps()} />)
    const decorations = [...container.querySelectorAll('[data-stack-decoration]')]
    expect(decorations.length).toBeGreaterThanOrEqual(1)
    expect(decorations.length).toBeLessThanOrEqual(2)
    for (const decoration of decorations) {
      expect(decoration).toHaveAttribute('aria-hidden', 'true')
      expect(decoration.querySelector('[data-target]')).toBeNull()
      expect(decoration.querySelector('button')).toBeNull()
    }
  })

  it('押せるボタンは前面のカードのぶんだけ（× と CTA の 2 つ）', () => {
    const { container } = render(<DensityStack {...shellProps()} />)
    expect(container.querySelectorAll('button')).toHaveLength(2)
  })

  it('宣言していない部位（media / legal）は描かない', () => {
    const { container } = render(<DensityStack {...shellProps()} />)
    expect(container.querySelector('[data-target="media"]')).toBeNull()
    expect(screen.queryByText('※一部対象外の商品があります')).toBeNull()
  })

  it('操作先はすべて data-target を持つ', () => {
    const { container } = render(<DensityStack {...shellProps()} />)
    const targets = new Set(
      [...container.querySelectorAll('[data-target]')].map((el) => el.getAttribute('data-target')),
    )
    for (const expected of ['label', 'body', 'cta', 'close']) expect(targets).toContain(expected)
    // 宣言していない部位の intent を生やさない（descriptor が engine との契約）
    for (const target of targets) expect(densityStackDescriptor.parts).toContain(target)
  })

  it('stackIndex が上がっても描けるものは変わらない（層数を決めるのはエンジン）', () => {
    for (const stackIndex of [0, 1, 2]) {
      const { container, unmount } = render(<DensityStack {...shellProps({ stackIndex })} />)
      expect(container.firstElementChild).toHaveAttribute('data-stack-index', String(stackIndex))
      expect(container.querySelectorAll('button')).toHaveLength(2)
      unmount()
    }
  })

  it('カウントダウン中でも × は押せる', () => {
    render(
      <DensityStack
        {...shellProps({ parts: [partState('close', { enabled: false })], countdown: { remainingMs: 2700 } })}
      />,
    )
    expect(screen.getByRole('button', { name: '広告を閉じる' })).not.toBeDisabled()
    expect(screen.getByText('あと3秒')).toBeInTheDocument()
  })

  it('外部遷移もダウンロードも音声も持たない（SAFE-05 / DESIGN §20 NEVER）', () => {
    const { container } = render(<DensityStack {...shellProps()} />)
    expect(container.querySelector('a, [href], [download], audio, video, [autoplay]')).toBeNull()
  })

  it('descriptor は engine の宣言と同じ', () => {
    expect(densityStackDescriptor.parts).toEqual(['label', 'body', 'cta', 'close'])
    expect(densityStackDescriptor.supports).toEqual(['spawn', 'persist'])
  })
})

/**
 * videoPlayer — 隅に居座る偽の動画プレイヤー（ATT-01 / ATT-02 / OBS-06）。
 *
 * **音は鳴らさない**（DESIGN.md §20 NEVER autoplay sound / SAFE）。
 * 「🔊 音声が再生されています」は広告が名乗っているだけの偽表示で、実際の音源は存在しない。
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VideoPlayer } from './VideoPlayer'
import { videoPlayerDescriptor } from './descriptor'
import { FIXTURE_CREATIVE_DARK, partState, shellProps } from '../fixtures'

const VIDEO = { surface: 'corner', creative: FIXTURE_CREATIVE_DARK } as const

describe('videoPlayer', () => {
  it('ラベル / 映像面 / 再生コントロール / CTA / × を描く', () => {
    const { container } = render(<VideoPlayer {...shellProps(VIDEO)} />)
    expect(screen.getByText('PR')).toBeInTheDocument()
    expect(container.querySelector('[data-target="media"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: '再生する' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '広告を閉じる' })).toBeInTheDocument()
  })

  it('音声要素も自動再生属性も持たない（DESIGN §20 NEVER autoplay sound）', () => {
    const { container } = render(<VideoPlayer {...shellProps({ ...VIDEO, badge: '🔊 音声が再生されています' })} />)
    expect(container.querySelector('audio, video, [autoplay], [src]')).toBeNull()
  })

  it('見出しは映像面に焼き込む（body 部位を宣言していないため）', () => {
    const { container } = render(<VideoPlayer {...shellProps(VIDEO)} />)
    expect(container.querySelector('[data-target="media"]')?.textContent).toContain('続きは動画で')
    expect(container.querySelector('[data-target="body"]')).toBeNull()
  })

  it('badge（偽の音声表示）はエンジンが渡した文字列をそのまま描く', () => {
    render(<VideoPlayer {...shellProps({ ...VIDEO, badge: '🔊 音声が再生されています' })} />)
    expect(screen.getByText('🔊 音声が再生されています')).toBeInTheDocument()
  })

  it('reducedMotion のときは静止フレームで描く（DESIGN §20 reduced motion）', () => {
    const { container } = render(<VideoPlayer {...shellProps({ ...VIDEO, reducedMotion: true })} />)
    expect(container.firstElementChild).toHaveAttribute('data-reduced-motion', 'true')
  })

  it('通常時は動く映像面（静止フレームではない）', () => {
    const { container } = render(<VideoPlayer {...shellProps(VIDEO)} />)
    expect(container.firstElementChild).toHaveAttribute('data-reduced-motion', 'false')
  })

  it('再生コントロールは media 部位として宿主に伝わり、支援技術には正直に名乗る', () => {
    const { container } = render(<VideoPlayer {...shellProps(VIDEO)} />)
    const control = container.querySelector('button[data-target="media"]')
    expect(control).not.toBeNull()
    expect(control?.getAttribute('aria-label') ?? '').toContain('広告')
  })

  it('操作先はすべて data-target を持つ', () => {
    const { container } = render(<VideoPlayer {...shellProps(VIDEO)} />)
    const targets = new Set(
      [...container.querySelectorAll('[data-target]')].map((el) => el.getAttribute('data-target')),
    )
    for (const expected of ['label', 'media', 'cta', 'close']) expect(targets).toContain(expected)
    // 宣言していない部位の intent を生やさない（descriptor が engine との契約）
    for (const target of targets) expect(videoPlayerDescriptor.parts).toContain(target)
  })

  it('× の当たり判定は CloseButton に委ねる', () => {
    render(<VideoPlayer {...shellProps({ ...VIDEO, parts: [partState('close', { hitboxScale: 0.3 })] })} />)
    expect(
      screen.getByRole('button', { name: '広告を閉じる' }).style.getPropertyValue('--close-hitbox-scale'),
    ).toBe('1')
  })

  it('descriptor は engine の宣言と同じ', () => {
    expect(videoPlayerDescriptor.parts).toEqual(['label', 'media', 'cta', 'close'])
    expect(videoPlayerDescriptor.supports).toEqual(['spawn', 'persist', 'attention'])
  })
})

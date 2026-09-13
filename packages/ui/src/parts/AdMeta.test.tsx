/**
 * AdMeta — PR / Sponsored ラベル（DESIGN.md §8 anatomy / §13 microcopy）。
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AdMeta } from './AdMeta'
import { adCopy } from './copy'

describe('AdMeta', () => {
  it('既定のラベルは DESIGN.md §13 の「PR」', () => {
    render(<AdMeta />)
    expect(screen.getByText(adCopy.label.pr)).toBeInTheDocument()
  })

  it('label prop で §13 の語彙を差し替えられる', () => {
    render(<AdMeta label={adCopy.label.forYou} />)
    expect(screen.getByText('あなたにおすすめ')).toBeInTheDocument()
  })

  it('intent マッピング用に data-target="label" と data-instance を持つ（TASK-014）', () => {
    render(<AdMeta label="PR" instanceId="ad-1" />)
    const meta = screen.getByText('PR')
    expect(meta).toHaveAttribute('data-target', 'label')
    expect(meta).toHaveAttribute('data-instance', 'ad-1')
  })

  it('emphasis を data 属性として出す（0/1/2）', () => {
    render(<AdMeta label="PR" emphasis={2} />)
    expect(screen.getByText('PR')).toHaveAttribute('data-emphasis', '2')
  })

  it('visible=false のときは何も描かない', () => {
    const { container } = render(<AdMeta label="PR" visible={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})

/**
 * AdHeadline / AdBody / AdLegal（DESIGN.md §5 ad_headline / body / ad_legal, §8 anatomy）。
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AdBody } from './AdBody'
import { AdHeadline } from './AdHeadline'
import { AdLegal } from './AdLegal'

describe('AdHeadline', () => {
  it('既定では見出しタグを強制しない（部位は presentational / 見出し階層は宿主が決める）', () => {
    render(<AdHeadline>今だけ無料で受け取れます</AdHeadline>)
    expect(screen.getByText('今だけ無料で受け取れます').tagName).toBe('P')
  })

  it('as で見出しレベルを指定できる', () => {
    render(<AdHeadline as="h2">重要なお知らせ</AdHeadline>)
    expect(screen.getByRole('heading', { level: 2, name: '重要なお知らせ' })).toBeInTheDocument()
  })

  it('本文クリックは body 部位として扱う（data-target="body"）', () => {
    render(<AdHeadline instanceId="ad-7">見出し</AdHeadline>)
    const headline = screen.getByText('見出し')
    expect(headline).toHaveAttribute('data-target', 'body')
    expect(headline).toHaveAttribute('data-instance', 'ad-7')
  })

  it('visible=false のときは何も描かない', () => {
    const { container } = render(<AdHeadline visible={false}>見出し</AdHeadline>)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('AdBody', () => {
  it('短いコピーを body 部位として描く', () => {
    render(<AdBody instanceId="ad-2">3秒でわかる診断</AdBody>)
    const body = screen.getByText('3秒でわかる診断')
    expect(body).toHaveAttribute('data-target', 'body')
    expect(body).toHaveAttribute('data-instance', 'ad-2')
  })
})

describe('AdLegal', () => {
  it('極小の注意書きを描く', () => {
    render(<AdLegal>※ これは架空の広告です。</AdLegal>)
    expect(screen.getByText('※ これは架空の広告です。')).toHaveAttribute('data-target', 'body')
  })
})

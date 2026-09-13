import { describe, expect, it } from 'vitest'
import { ARTICLES, articleRunConfig, lineOffset, pickArticle, totalLines } from './index'

const REAL_OUTLETS = ['朝日', '読売', '毎日', '日経', 'NHK', 'Yahoo', 'ヤフー', 'Google', 'note', 'はてな', '文春', '新潮', 'Wired', 'ITmedia', 'BuzzFeed']

describe('架空の記事データ（TASK-015）', () => {
  it('has at least 3 articles, each with 2 questions placed inside the body', () => {
    expect(ARTICLES.length).toBeGreaterThanOrEqual(3)
    for (const a of ARTICLES) {
      expect(a.paragraphs.length).toBeGreaterThanOrEqual(5)
      expect(a.questions).toHaveLength(2)
      for (const q of a.questions) {
        expect(q.afterParagraph).toBeGreaterThanOrEqual(0)
        expect(q.afterParagraph).toBeLessThan(a.paragraphs.length)
        expect(q.correctChoice).toBeGreaterThanOrEqual(0)
        expect(q.correctChoice).toBeLessThan(q.choices.length)
        expect(new Set(q.choices).size).toBe(q.choices.length)
      }
      // 記事途中と末尾に 1 つずつ
      expect(a.questions.some((q) => q.afterParagraph < a.paragraphs.length - 1)).toBe(true)
      expect(a.questions.some((q) => q.afterParagraph === a.paragraphs.length - 1)).toBe(true)
    }
  })

  it('does not imitate real media outlets', () => {
    for (const a of ARTICLES) {
      const text = `${a.outlet} ${a.title} ${a.lede} ${a.author} ${a.paragraphs.join(' ')}`
      for (const real of REAL_OUTLETS) expect(text.toLowerCase(), `${a.id} mentions ${real}`).not.toContain(real.toLowerCase())
    }
    expect(new Set(ARTICLES.map((a) => a.id)).size).toBe(ARTICLES.length)
  })

  it('picks deterministically by seed and covers more than one article across seeds', () => {
    expect(pickArticle('seed-a').id).toBe(pickArticle('seed-a').id)
    const ids = new Set(Array.from({ length: 50 }, (_, i) => pickArticle(`s${i}`).id))
    expect(ids.size).toBeGreaterThan(1)
  })

  it('line accounting is consistent and yields a reasonable read length (30–120 lines)', () => {
    for (const a of ARTICLES) {
      const total = totalLines(a)
      expect(total).toBeGreaterThanOrEqual(30)
      expect(total).toBeLessThanOrEqual(120)
      expect(lineOffset(a, a.paragraphs.length)).toBe(total)
      const cfg = articleRunConfig(a)
      expect(cfg.contentTotalLines).toBe(total)
      expect(cfg.questions.map((q) => q.id)).toEqual(['q1', 'q2'])
    }
  })
})

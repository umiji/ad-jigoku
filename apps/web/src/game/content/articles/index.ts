import { articleYakanKanko } from './a1-yakan-kanko'
import { articleKanbanmono } from './a2-shosetsu-kanbanmono'
import { articleTetsudoJikoku } from './a3-tetsudo-jikoku'
import { totalLines, type Article } from './types'

export const ARTICLES: readonly Article[] = [articleYakanKanko, articleKanbanmono, articleTetsudoJikoku]

/**
 * 記事は seed で選ばれる（リプレイ性）。同じ seed → 同じ記事。
 * ハッシュは game-engine の xmur3 と同じ式（この module は e2e からも import されるので engine に依存させない）。
 */
export function articleHash(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

export function pickArticle(seed: string): Article {
  return ARTICLES[articleHash(`${seed}:article`) % ARTICLES.length]!
}

/** エンジンに渡す設問キーと総行数 */
export function articleRunConfig(article: Article): { contentTotalLines: number; questions: { id: string; correctChoice: number }[] } {
  return { contentTotalLines: totalLines(article), questions: article.questions.map((q) => ({ id: q.id, correctChoice: q.correctChoice })) }
}

export * from './types'

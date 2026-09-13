import { xmur3 } from '@ad-jigoku/game-engine'
import { articleYakanKanko } from './a1-yakan-kanko'
import { articleKanbanmono } from './a2-shosetsu-kanbanmono'
import { articleTetsudoJikoku } from './a3-tetsudo-jikoku'
import { totalLines, type Article } from './types'

export const ARTICLES: readonly Article[] = [articleYakanKanko, articleKanbanmono, articleTetsudoJikoku]

/** 記事は seed で選ばれる（リプレイ性）。同じ seed → 同じ記事 */
export function pickArticle(seed: string): Article {
  const h = xmur3(`${seed}:article`)()
  return ARTICLES[h % ARTICLES.length]!
}

/** エンジンに渡す設問キーと総行数 */
export function articleRunConfig(article: Article): { contentTotalLines: number; questions: { id: string; correctChoice: number }[] } {
  return { contentTotalLines: totalLines(article), questions: article.questions.map((q) => ({ id: q.id, correctChoice: q.correctChoice })) }
}

export * from './types'

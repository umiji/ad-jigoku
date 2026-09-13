/**
 * 記事メタデータの型（TASK-015）。本文そのものは UI 側（apps/web/src/game/content/articles）が持つ。
 * エンジンが知るのは「総行数」と「設問の正解」だけ。
 */
export type ArticleQuestionMeta = {
  id: string
  /** 記事のどの段落の後に出すか（0 始まり）。末尾なら paragraphs.length - 1 */
  afterParagraph: number
  correctChoice: number
}

export type ArticleMeta = {
  id: string
  /** 総行数（progress.total）。UI 側の段落行数の合計 */
  totalLines: number
  questions: ArticleQuestionMeta[]
}

/** 記事を seed で選ぶ（rng('creative') と同じ決定論。index は生成器が渡す） */
export function pickArticleIndex(count: number, seedHash: number): number {
  if (count <= 0) throw new RangeError('pickArticleIndex: 記事が 0 件')
  return Math.abs(seedHash) % count
}

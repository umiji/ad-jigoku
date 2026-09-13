/**
 * 架空の記事データ（TASK-015）。実在メディアを模倣しない。
 * 「読みたいと思える」普通に読める内容にする（読みたくなければ邪魔される悔しさが生まれない）。
 */
export type ArticleQuestion = {
  id: string
  /** どの段落の後に出すか（0 始まり） */
  afterParagraph: number
  prompt: string
  choices: string[]
  correctChoice: number
}

export type Article = {
  id: string
  /** 架空媒体名 */
  outlet: string
  kicker: string
  title: string
  lede: string
  author: string
  /** 段落。1 段落 = 数行として `linesOf` で行数換算する */
  paragraphs: string[]
  questions: ArticleQuestion[]
}

/** 1 段落あたりの論理行数（モバイル幅の 16 文字で 1 行、最低 2 行）。読了時間 ≈ 行数 / READ_LINES_PER_SECOND */
export const CHARS_PER_LINE = 16
export function linesOf(paragraph: string): number {
  return Math.max(2, Math.ceil(paragraph.length / CHARS_PER_LINE))
}
export function totalLines(article: Article): number {
  return article.paragraphs.reduce((sum, p) => sum + linesOf(p), 0)
}
/** 段落 i の先頭行（累積） */
export function lineOffset(article: Article, paragraphIndex: number): number {
  return article.paragraphs.slice(0, paragraphIndex).reduce((sum, p) => sum + linesOf(p), 0)
}

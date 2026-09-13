/**
 * 広告コピーの辞書（OD-9: コピーはコンポーネントにハードコードしない）。
 *
 * 語彙は `DESIGN.md §13 Microcopy` から。実在の広告文をそのまま複製しない（§13 末尾）。
 * 面白さは「パターンに見覚えがあること」から来るのであって、実物の再現からではない。
 *
 * 広告素材そのもの（見出し・本文・CTA 文言・ブランド名）は TASK-013D の Creative データが持つ。
 * ここにあるのは**どの広告にも共通する UI 文言**だけ。
 */

/** `{seconds}` のような差し込みを埋める。テンプレートはデータ、埋めるのはここ */
export function fillCopy(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const value = values[key]
    return value === undefined ? whole : String(value)
  })
}

export const adCopy = {
  /** DESIGN.md §13 の語彙。広告ラベル */
  label: {
    pr: 'PR',
    sponsored: 'Sponsored',
    notice: '重要なお知らせ',
    limited: '今だけ',
    recommended: 'おすすめ',
    forYou: 'あなたにおすすめ',
  },

  /** 本物の閉じるボタン（DESIGN.md §20「accessible close labels」） */
  close: {
    /** 支援技術に読まれる唯一のラベル。ここは絶対に嘘をつかない */
    ariaLabel: '広告を閉じる',
    text: '閉じる',
    confirm: '本当に閉じますか？',
  },

  /**
   * 偽の閉じるボタン（TASK-013 implementation requirement 4）。
   * 見た目は × でよいが、支援技術には「閉じない」と正しく伝える。
   */
  fakeClose: {
    ariaLabel: 'これは広告のボタンです（閉じるボタンではありません）',
    decoyAriaLabel: 'これは広告の囮のボタンです（閉じるボタンではありません）',
  },

  /** カウントダウン（DESIGN_REQUIREMENTS §5.3 Pattern B / GAME §15.4: 必ず見せる） */
  countdown: {
    /** DESIGN.md §13「あと3秒」 */
    remainingJa: 'あと{seconds}秒',
    /** DESIGN_REQUIREMENTS §5.3 B「閉じるまで 2.7 sec」 */
    remainingSec: '閉じるまで {seconds} sec',
    /** 0 になった状態。§13 の「閉じる」から派生 */
    ready: '閉じられます',
  },

  /** 極小の注意書き（DESIGN_REQ §22 Trust:「本物の広告ではないことが明確」） */
  legal: {
    fiction: '※ これは架空の広告です。実在の企業・商品とは関係ありません。外部サイトへは移動しません。',
  },
} as const

export type AdCopy = typeof adCopy

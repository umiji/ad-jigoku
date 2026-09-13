/**
 * DESIGN.md §16 Border / Radius / Shadow。値はそのまま写す（発明しない）。
 *
 * DESIGN §16 は radius しか数値を定義していない。shadow は「restrained」という
 * 方針だけなので、値が必要になったら DESIGN.md を改訂してから足す。
 */
export const shape = {
  baseRadius: '4px',
  popupRadius: '2px',
  buttonRadius: '2px',
  cardRadius: '6px',
} as const

export type ShapeToken = keyof typeof shape

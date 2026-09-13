import styles from './AdCreative.module.css'

/**
 * 抽象的なダミービジュアル（DESIGN.md §17 Imagery: 写真もAI人物画像も使わない）。
 *
 * 実在ブランドの模倣をしないために、図形しか描かない（DESIGN.md §3 MUST NOT 9）。
 * 色は `currentColor` だけを使う。面のテーマが決めた accent がそのまま入る。
 *
 * どの図を使うかは `creative.id` から決定論的に決める。`Math.random` を使わない
 * （同じ広告は毎回同じ顔をしている＝プレイヤーが学習できる / スナップショットが安定する）。
 */
export const GRAPHIC_VARIANT_COUNT = 4

/** FNV-1a 32bit。ハッシュの質より決定性と移植性が要る場所 */
export function graphicVariant(id: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash % GRAPHIC_VARIANT_COUNT
}

const VIEW_BOX = '0 0 160 90'

/** 0: 放射状のバースト。「今だけ」「大当たり」の記号 */
function Burst() {
  return (
    <g transform="rotate(9 80 45)">
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i * Math.PI) / 8
        return (
          <line
            key={i}
            x1={80}
            y1={45}
            x2={80 + Math.cos(angle) * 120}
            y2={45 + Math.sin(angle) * 120}
            stroke="currentColor"
            strokeWidth={3}
            opacity={0.22}
          />
        )
      })}
      <circle cx={80} cy={45} r={30} fill="none" stroke="currentColor" strokeWidth={2} opacity={0.5} />
      <circle cx={80} cy={45} r={20} fill="none" stroke="currentColor" strokeWidth={4} />
      <circle cx={80} cy={45} r={8} fill="currentColor" />
    </g>
  )
}

/** 1: 網点グリッド + 斜めのバー。印刷物っぽいノイズ */
function Halftone() {
  return (
    <g>
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 14 }, (_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={8 + col * 12}
            cy={8 + row * 12}
            r={1 + ((row + col) % 4)}
            fill="currentColor"
            opacity={0.55}
          />
        )),
      )}
      <rect x={-10} y={34} width={190} height={16} fill="currentColor" transform="rotate(-8 80 45)" />
    </g>
  )
}

/** 2: ずれて重なる矩形。「広告が積み上がる」こと自体の図像 */
function Stack() {
  return (
    <g>
      <rect x={16} y={12} width={104} height={52} fill="none" stroke="currentColor" strokeWidth={3} opacity={0.35} />
      <rect x={28} y={22} width={104} height={52} fill="none" stroke="currentColor" strokeWidth={3} opacity={0.6} />
      <rect x={40} y={32} width={104} height={52} fill="currentColor" opacity={0.9} />
    </g>
  )
}

/** 3: 右向きのシェブロン。偽の「次へ / 再生」記号 */
function Chevrons() {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${34 + i * 34} 20 L${60 + i * 34} 45 L${34 + i * 34} 70`}
          fill="none"
          stroke="currentColor"
          strokeWidth={10}
          strokeLinecap="square"
          opacity={0.35 + i * 0.3}
        />
      ))}
    </g>
  )
}

const VARIANTS = [Burst, Halftone, Stack, Chevrons] as const

export function CreativeGraphic({ variant }: { readonly variant: number }) {
  const Shape = VARIANTS[variant % GRAPHIC_VARIANT_COUNT] ?? Burst
  return (
    <svg className={styles.graphic} viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <Shape />
    </svg>
  )
}

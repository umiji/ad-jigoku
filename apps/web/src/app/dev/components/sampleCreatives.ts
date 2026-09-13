import type { CreativeContent } from '@ad-jigoku/ui'

/**
 * `/dev/components` 用の架空広告素材（DESIGN.md §3 MUST NOT 9: 実在ブランドを使わない）。
 *
 * **本番の素材ではない。** 本番の Creative データは TASK-013D が
 * `packages/pattern-catalog/src/creative` に持ち、NG ワード検査（`pnpm check-creatives`）を通る。
 * ここにあるのは「部位が全パターンで壊れないか」を目で見るための最小サンプル。
 * 013D の `Creative` はこの `CreativeContent` に構造的に一致するので、そのまま差し替えられる。
 *
 * id は 4 種類の抽象グラフィックが全部出るように選んである（graphicVariant 0/1/2/3）。
 */
export const SALE_CREATIVE: CreativeContent = {
  id: 'cr-sale-0001',
  kind: 'sale',
  brand: 'ジゴク屋',
  headline: '今だけ90%オフ',
  body: '在庫はあと3点です。',
  cta: '今すぐ受け取る',
  theme: 'popup',
}

export const VIDEO_CREATIVE: CreativeContent = {
  id: 'cr-video-0004',
  kind: 'video',
  brand: 'ムゲン動画',
  headline: '続きは動画で',
  body: '最後まで無料で見られます。',
  cta: '再生する',
  theme: 'popupDark',
}

export const APP_CREATIVE: CreativeContent = {
  id: 'cr-app-0005',
  kind: 'app',
  brand: 'ポチポチ農園',
  headline: '1分で育つ農園',
  body: '今なら種を10個プレゼント。',
  cta: 'インストール',
  legal: '※ 架空のアプリです。ダウンロードは発生しません。',
  theme: 'danger',
}

export const DOWNLOAD_CREATIVE: CreativeContent = {
  id: 'cr-download-0003',
  kind: 'download',
  brand: 'らくらく圧縮',
  headline: 'ファイルを高速化',
  body: 'ワンタップで軽くなります。',
  cta: 'ダウンロード',
  theme: 'warning',
}

export const SAMPLE_CREATIVES: readonly CreativeContent[] = [
  SALE_CREATIVE,
  VIDEO_CREATIVE,
  APP_CREATIVE,
  DOWNLOAD_CREATIVE,
]

/** 同じ素材を別のテーマで並べて見比べるための対応表（4 素材 × 2 テーマ） */
export const ALTERNATE_THEMES: Readonly<Record<CreativeContent['theme'], CreativeContent['theme']>> = {
  popup: 'popupDark',
  popupDark: 'popup',
  danger: 'warning',
  warning: 'danger',
}

/**
 * CSS Modules の型宣言。
 * 各 part は `X.module.css` を隣に置く（packages/ui/README.md「parts」節）。
 * バンドラ（Next / Vite）はクラス名のマップを返すが、tsc は CSS を知らないのでここで宣言する。
 */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}

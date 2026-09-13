import { SHELL_COMPONENTS as UI_SHELL_COMPONENTS } from '@ad-jigoku/ui'
import type { ShellComponentMap } from './AdLayer'

/**
 * shellId → Shell コンポーネント。実体は packages/ui/src/shells（TASK-013A / 013B）。
 *
 * ここは「宿主の props 契約（./shellProps.ts）に UI 側のシェルを差す」だけの結線点。
 * 型が合わなくなったら（engine の ViewState を変えたのに ui 側の写しを直していない等）、
 * この代入がコンパイルエラーになる。
 *
 * まだ UI 実装が無い shellId（fakeDownload / fakePlay。TASK-013C）は
 * AdLayer の fallback（GenericShell）で描かれる。
 */
export const SHELL_COMPONENTS: ShellComponentMap = UI_SHELL_COMPONENTS

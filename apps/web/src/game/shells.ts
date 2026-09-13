import type { ShellComponentMap } from './AdLayer'

/**
 * shellId → Shell コンポーネント。packages/ui/shells の本実装（TASK-013A/B/C）が入るまでは空。
 * 未登録の shellId は AdLayer の fallback（GenericShell）で描かれる。
 */
export const SHELL_COMPONENTS: ShellComponentMap = {}

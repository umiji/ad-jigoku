import styles from './adTheme.module.css'
import type { CreativeTheme } from './types'

/**
 * `CreativeTheme` → 広告面のローカル変数を宣言するクラス（adTheme.module.css）。
 * 生の色を返さない。返すのは「どのトークンの組を使うか」だけ。
 */
const THEME_CLASS: Record<CreativeTheme, string> = {
  popup: 'popup',
  popupDark: 'popup-dark',
  danger: 'danger',
  warning: 'warning',
}

export function adThemeClass(theme: CreativeTheme): string | undefined {
  return styles[THEME_CLASS[theme]]
}

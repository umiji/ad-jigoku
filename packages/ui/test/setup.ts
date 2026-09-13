/**
 * vitest のセットアップ（packages/ui のコンポーネントテスト用）。
 *
 * - jest-dom のマッチャ（toHaveAttribute / toBeVisible …）を vitest の expect に足す
 * - テストごとに React のマウントを破棄する（globals: false なので明示的に呼ぶ）
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

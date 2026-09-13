import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// RTL は globals なしでは自動 cleanup しないので、テスト毎に DOM を掃除する
afterEach(() => cleanup())

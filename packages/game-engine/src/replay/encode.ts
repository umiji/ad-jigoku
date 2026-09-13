import type { ReplayRecord } from './record'

/**
 * 符号化（TASK-012 要件 5）。
 * - 「同じ地獄」の共有は seed URL（stage/seed-url.ts: `?s=&st=&m=&cv=`）だけで足りる。入力列は不要
 * - 入力列まで含むフルリプレイは別形式: JSON（ファイル / 将来のサーバ保存）。ここでは
 *   intents を短いタプル配列に圧縮して JSON にする
 */
export { encodeSeedParams, decodeSeedParams } from '../stage/seed-url'

export function encodeReplay(record: ReplayRecord): string {
  return JSON.stringify(record)
}

export function decodeReplay(text: string): { ok: true; record: ReplayRecord } | { ok: false; message: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { ok: false, message: `JSON として不正: ${e instanceof Error ? e.message : String(e)}` }
  }
  if (!isRecord(parsed)) return { ok: false, message: 'ReplayRecord の形式ではない' }
  return { ok: true, record: parsed }
}

function isRecord(x: unknown): x is ReplayRecord {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  const v = r['version'] as Record<string, unknown> | undefined
  const c = r['config'] as Record<string, unknown> | undefined
  return (
    typeof v?.['engine'] === 'string' &&
    typeof v?.['catalog'] === 'string' &&
    typeof c?.['seed'] === 'string' &&
    typeof c?.['stageId'] === 'string' &&
    Array.isArray(r['inputs']) &&
    typeof r['totalSteps'] === 'number' &&
    typeof r['finalStateHash'] === 'string'
  )
}

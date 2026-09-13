/**
 * seed URL（TASK-008 要件 11 / TASK-012 要件 5）。
 * `?s=<seed>&st=<stage>&m=<mode>&cv=<catalogVersion>` で「同じ地獄」を共有する。入力列は含まない。
 * catalogVersion が不一致なら「旧バージョンの地獄です」と明示する（黙って違う結果を出さない）。
 */
export type SeedLink = { seed: string; stageId: string; mode: 'story' | 'endless' | 'tutorial'; catalogVersion: string }

export function encodeSeedParams(link: SeedLink): string {
  const p = new URLSearchParams()
  p.set('s', link.seed)
  p.set('st', link.stageId)
  p.set('m', link.mode)
  p.set('cv', link.catalogVersion)
  return p.toString()
}

export type DecodedSeed =
  | { ok: true; link: SeedLink; catalogMismatch: false }
  | { ok: true; link: SeedLink; catalogMismatch: true; message: string }
  | { ok: false; reason: string }

export function decodeSeedParams(query: string, currentCatalogVersion: string): DecodedSeed {
  const p = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query)
  const seed = p.get('s')
  const stageId = p.get('st')
  const mode = p.get('m') ?? 'story'
  const cv = p.get('cv') ?? currentCatalogVersion
  if (!seed || !stageId) return { ok: false, reason: 'seed (s) と stage (st) は必須' }
  if (mode !== 'story' && mode !== 'endless' && mode !== 'tutorial') return { ok: false, reason: `未知の mode "${mode}"` }
  const link: SeedLink = { seed, stageId, mode, catalogVersion: cv }
  if (cv !== currentCatalogVersion) {
    return { ok: true, link, catalogMismatch: true, message: `これは旧バージョン（catalog ${cv}）の地獄です。現在は ${currentCatalogVersion} なので、同じ構成にならない場合があります。` }
  }
  return { ok: true, link, catalogMismatch: false }
}

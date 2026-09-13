// @ad-jigoku/ui — DESIGN.md の唯一の実体（ARCHITECTURE.md §10.1）。
//
//   tokens/  … DESIGN.md §4,5,6,14,15,16,19 の値
//   parts/   … 広告の部位（DESIGN.md §8 anatomy / §21 canonical component）
//   shells/  … 広告の面（DESIGN.md §8 / §9）。各シェルは独立モジュール（DECISIONS_v0.2 §1.3）
//
// fakeDownload / fakePlay の 2 シェルは TASK-013C で追加される。
export * from '../tokens/index'
export * from './parts/index'
export * from './shells/index'

import type { NextConfig } from 'next'

/**
 * Phase 1 は静的書き出し（DECISIONS_v0.2 §8, D8）。Cloudflare Pages が `out/` を配信する。
 * SSR / ISR が必要になる Phase 3-4 で再判断する（ARCHITECTURE §16, OD-2）。
 */
const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  // workspace パッケージは TS ソースをそのまま配布するので Next 側でトランスパイルする
  transpilePackages: ['@ad-jigoku/pattern-catalog', '@ad-jigoku/game-engine', '@ad-jigoku/ui'],
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig

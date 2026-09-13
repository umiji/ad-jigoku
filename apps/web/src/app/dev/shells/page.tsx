'use client'

import { loadCreatives, type Creative } from '@ad-jigoku/pattern-catalog'
import {
  DensityStack,
  InlineRect,
  Interstitial,
  Popup,
  StickyBanner,
  VideoPlayer,
  type AdPartState,
  type Emphasis,
  type ShellProps,
} from '@ad-jigoku/ui'
import styles from './page.module.css'

/**
 * `/dev/shells` — シェル（TASK-013A / 013B）の Storybook 相当。
 *
 * 部位の確認ページ（`/dev/components`）とは分けてある。あちらは視覚回帰のベースラインが
 * すでにあるので、シェルを足して差分を出さないため。
 *
 * ここが Playwright（apps/web/e2e/shells.spec.ts）の検査対象でもある:
 * 44×44 の実測、axe、視覚回帰。
 *
 * 素材は本番の Creative データ（TASK-013D）から決定論的に 2 件引く。乱数は使わない。
 */
const CREATIVES = loadCreatives()

function pickCreative(theme: Creative['theme']): Creative {
  const found = CREATIVES.find((c) => c.theme === theme) ?? CREATIVES[0]
  if (found === undefined) throw new Error('Creative データが空（TASK-013D）')
  return found
}

const PAPER = pickCreative('popup')
const DARK = pickCreative('popupDark')

const ALL_PARTS = ['label', 'body', 'media', 'cta', 'legal', 'close'] as const

function part(name: AdPartState['part'], overrides: Partial<Omit<AdPartState, 'part'>> = {}): AdPartState {
  return { part: name, visible: true, enabled: true, emphasis: 1, hitboxScale: 1, ...overrides }
}

function defaultParts(): AdPartState[] {
  return ALL_PARTS.map((name) => part(name))
}

/** どのシェルにも同じ形で props を渡す。挙動は無い（シェルは props のとおりに描くだけ） */
function shellProps(instanceId: string, overrides: Partial<ShellProps> = {}): ShellProps {
  return {
    instanceId,
    lifecycle: 'closable',
    sizeHint: 'medium',
    surface: 'overlay',
    stackIndex: 0,
    parts: defaultParts(),
    motion: [],
    creative: PAPER,
    creativeIndex: 0,
    reducedMotion: false,
    ageMs: 0,
    ...overrides,
  }
}

/** close だけ状態を差し替えた parts（他の部位は既定のまま） */
function partsWithClose(overrides: Partial<Omit<AdPartState, 'part'>>): AdPartState[] {
  return ALL_PARTS.map((name) => (name === 'close' ? part(name, overrides) : part(name)))
}

function partsWithEmphasis(emphasis: Emphasis): AdPartState[] {
  return ALL_PARTS.map((name) => part(name, { emphasis }))
}

const NOTE = 'text-ad-legal text-text-secondary'
const SECTION_LABEL = 'text-ad-meta uppercase text-text-secondary'

function Section({ title, source, children }: { title: string; source: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-subtle pt-24 pb-32">
      <p className={SECTION_LABEL}>{source}</p>
      <h2 className="text-h2 mb-16">{title}</h2>
      <ul role="list" className={styles.grid}>
        {children}
      </ul>
    </section>
  )
}

/**
 * 1 ケース分の枠。宿主のスロット（AdLayer）の代わりに幅だけ与える。
 * `size` は DESIGN.md §19 の想定幅: `mobile` = モバイル 1 画面ぶん / `wide` = デスクトップの広告幅。
 */
function Case({
  label,
  size = 'popup',
  children,
}: {
  label: string
  size?: 'popup' | 'mobile' | 'wide' | 'full'
  children: React.ReactNode
}) {
  return (
    <li className={styles.case}>
      <p className={NOTE}>{label}</p>
      <div className={`${styles.frame} ${styles[size]}`}>{children}</div>
    </li>
  )
}

export default function DevShellsPage() {
  return (
    <main className="container-gutter mx-auto max-w-content py-48">
      <p className={SECTION_LABEL}>DEV ONLY — DESIGN.md §8 / §9 / §16 / §19 / §23</p>
      <h1 className="text-h1">広告の面（shells）</h1>
      <p className="text-body text-text-secondary mt-16">
        シェルは独立モジュール（DECISIONS_v0.2 §1.3）。共通の土台は無く、共有するのは
        <code>/dev/components</code> にある部位だけ。ここにあるのは全部 presentational で、
        閉じるタイミングも移動も再出現も持たない。位置・z 順・出入りのモーションは宿主のスロットが持つので、
        このページでは「箱の中身」だけが見える。
      </p>

      <Section title="popup" source="DESIGN.md §8 anatomy / §16.1">
        <Case label="lifecycle: entering">
          <Popup {...shellProps('popup-entering', { lifecycle: 'entering' })} />
        </Case>
        <Case label="lifecycle: visible">
          <Popup {...shellProps('popup-visible', { lifecycle: 'visible' })} />
        </Case>
        <Case label="lifecycle: closable">
          <Popup {...shellProps('popup-closable')} />
        </Case>
        <Case label="close: enabled=false / countdown 2700ms">
          <Popup
            {...shellProps('popup-countdown', {
              lifecycle: 'visible',
              parts: partsWithClose({ enabled: false }),
              countdown: { remainingMs: 2700 },
            })}
          />
        </Case>
        <Case label="emphasis 0（気配だけ）">
          <Popup {...shellProps('popup-quiet', { parts: partsWithEmphasis(0) })} />
        </Case>
        <Case label="emphasis 2（押させたい）">
          <Popup {...shellProps('popup-loud', { parts: partsWithEmphasis(2) })} />
        </Case>
        <Case label="creative 2 件目（暗い広告）">
          <Popup {...shellProps('popup-dark', { creative: DARK })} />
        </Case>
        <Case label="moving close（anchor 24% / 78%）">
          <Popup
            {...shellProps('popup-moving', {
              parts: partsWithClose({ anchor: { xPercent: 24, yPercent: 78 } }),
            })}
          />
        </Case>
        <Case label="モバイル幅（390px）" size="mobile">
          <Popup {...shellProps('popup-mobile')} />
        </Case>
      </Section>

      <Section title="interstitial" source="DESIGN.md §9 Fullscreen / §19">
        <Case label="全画面（紙色の素材でも暗い面に倒す）" size="full">
          <Interstitial {...shellProps('interstitial-visible', { surface: 'fullscreen', sizeHint: 'fullscreen' })} />
        </Case>
        <Case label="close: enabled=false / countdown 2700ms" size="full">
          <Interstitial
            {...shellProps('interstitial-countdown', {
              surface: 'fullscreen',
              sizeHint: 'fullscreen',
              lifecycle: 'visible',
              parts: partsWithClose({ enabled: false }),
              countdown: { remainingMs: 2700 },
            })}
          />
        </Case>
        <Case label="creative 2 件目 / emphasis 2" size="full">
          <Interstitial
            {...shellProps('interstitial-dark', {
              surface: 'fullscreen',
              sizeHint: 'fullscreen',
              creative: DARK,
              parts: partsWithEmphasis(2),
            })}
          />
        </Case>
        <Case label="モバイル幅（390px）" size="mobile">
          <Interstitial {...shellProps('interstitial-mobile', { surface: 'fullscreen', sizeHint: 'fullscreen' })} />
        </Case>
      </Section>

      <Section title="stickyBanner" source="DESIGN.md §9 Sticky Ad / §16.1 shadow.sticky">
        <Case label="lifecycle: closable" size="wide">
          <StickyBanner {...shellProps('sticky-closable', { surface: 'sticky-bottom', sizeHint: 'small' })} />
        </Case>
        <Case label="close: enabled=false / countdown 2700ms" size="wide">
          <StickyBanner
            {...shellProps('sticky-countdown', {
              surface: 'sticky-bottom',
              sizeHint: 'small',
              lifecycle: 'visible',
              parts: partsWithClose({ enabled: false }),
              countdown: { remainingMs: 2700 },
            })}
          />
        </Case>
        <Case label="creative 2 件目 / emphasis 2" size="wide">
          <StickyBanner
            {...shellProps('sticky-dark', {
              surface: 'sticky-bottom',
              sizeHint: 'small',
              creative: DARK,
              parts: partsWithEmphasis(2),
            })}
          />
        </Case>
        <Case label="モバイル幅（390px。96px を超えない）" size="mobile">
          <StickyBanner {...shellProps('sticky-mobile', { surface: 'sticky-bottom', sizeHint: 'small' })} />
        </Case>
      </Section>

      <Section title="inlineRect" source="DESIGN.md §9 Layout Shift / ADR-006">
        <Case label="lifecycle: visible">
          <InlineRect {...shellProps('rect-visible', { surface: 'inline', lifecycle: 'visible' })} />
        </Case>
        <Case label="offset -14%（transform だけ。document flow は変えない）">
          <InlineRect {...shellProps('rect-offset', { surface: 'inline', offset: { yPercent: -14 } })} />
        </Case>
        <Case label="creative 2 件目 / emphasis 2">
          <InlineRect
            {...shellProps('rect-dark', { surface: 'inline', creative: DARK, parts: partsWithEmphasis(2) })}
          />
        </Case>
        <Case label="モバイル幅（390px）" size="mobile">
          <InlineRect {...shellProps('rect-mobile', { surface: 'inline' })} />
        </Case>
      </Section>

      <Section title="videoPlayer" source="TASK-013B / DESIGN.md §20 NEVER autoplay sound">
        <Case label="通常（映像は CSS だけ。動画も音源も読まない）">
          <VideoPlayer {...shellProps('video-normal', { surface: 'corner', creative: DARK })} />
        </Case>
        <Case label="reducedMotion: true（静止フレーム）">
          <VideoPlayer
            {...shellProps('video-reduced', { surface: 'corner', creative: DARK, reducedMotion: true })}
          />
        </Case>
        <Case label="badge（偽の音声表示）+ countdown 2700ms">
          <VideoPlayer
            {...shellProps('video-badge', {
              surface: 'corner',
              creative: DARK,
              lifecycle: 'visible',
              badge: '🔊 音声が再生されています',
              parts: partsWithClose({ enabled: false }),
              countdown: { remainingMs: 2700 },
            })}
          />
        </Case>
        <Case label="creative 2 件目（紙色）/ emphasis 2">
          <VideoPlayer
            {...shellProps('video-paper', { surface: 'corner', parts: partsWithEmphasis(2) })}
          />
        </Case>
        <Case label="モバイル幅（390px）" size="mobile">
          <VideoPlayer {...shellProps('video-mobile', { surface: 'corner', creative: DARK })} />
        </Case>
      </Section>

      <Section title="densityStack" source="DESIGN.md §9 Layered Ad / §15">
        <Case label="stackIndex 0">
          <DensityStack {...shellProps('stack-0', { stackIndex: 0 })} />
        </Case>
        <Case label="stackIndex 1（別の素材）">
          <DensityStack {...shellProps('stack-1', { stackIndex: 1, creative: DARK })} />
        </Case>
        <Case label="stackIndex 2 / close: enabled=false / countdown 2700ms">
          <DensityStack
            {...shellProps('stack-2', {
              stackIndex: 2,
              lifecycle: 'visible',
              parts: partsWithClose({ enabled: false }),
              countdown: { remainingMs: 2700 },
            })}
          />
        </Case>
        <Case label="3 層（エンジンが別インスタンスとして出す形。下敷きは装飾）">
          <div className={styles.layers}>
            <DensityStack {...shellProps('stack-layer-0', { stackIndex: 0 })} />
            <DensityStack {...shellProps('stack-layer-1', { stackIndex: 1, creative: DARK })} />
            <DensityStack {...shellProps('stack-layer-2', { stackIndex: 2, parts: partsWithEmphasis(2) })} />
          </div>
        </Case>
        <Case label="モバイル幅（390px）" size="mobile">
          <DensityStack {...shellProps('stack-mobile')} />
        </Case>
      </Section>
    </main>
  )
}

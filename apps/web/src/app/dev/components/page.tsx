'use client'

import { useState } from 'react'
import {
  AdBody,
  AdCountdown,
  AdCreative,
  AdCTA,
  AdHeadline,
  AdLegal,
  AdMeta,
  CloseButton,
  FakeCloseButton,
  adCopy,
  type Emphasis,
} from '@ad-jigoku/ui'
import { ALTERNATE_THEMES, APP_CREATIVE, SALE_CREATIVE, SAMPLE_CREATIVES } from './sampleCreatives'
import styles from './page.module.css'

/**
 * `/dev/components` — 部位（parts）の Storybook 相当（TASK-013 implementation requirement 7）。
 *
 * 全部位を全状態で並べる。ここが Playwright（apps/web/e2e/parts.spec.ts）の検査対象でもある:
 * 当たり判定 44px の実測、axe、キーボード操作、視覚回帰。
 *
 * このページ自体も DESIGN.md に従う（常にダーク / トークン以外の値を書かない / 角丸カードを並べない）。
 * メタデータは client component では書けないので、ここでは export しない（開発用ページなので許容）。
 */
const EMPHASIS_VALUES: readonly Emphasis[] = [0, 1, 2]
const SECTION_LABEL = 'text-ad-meta uppercase text-text-secondary'
const NOTE = 'text-ad-legal text-text-secondary'

function Section({ title, source, children }: { title: string; source: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-subtle pt-24 pb-32">
      <p className={SECTION_LABEL}>{source}</p>
      <h2 className="text-h2 mb-16">{title}</h2>
      {children}
    </section>
  )
}

/** 部位を 1 つずつ、状態のラベル付きで並べる枠。暗い面の上に置く */
function Slot({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.slot}>
      <p className={NOTE}>{label}</p>
      <div className={styles['slot-body']}>{children}</div>
    </div>
  )
}

export default function DevComponentsPage() {
  const [activations, setActivations] = useState(0)
  const count = () => setActivations((current) => current + 1)

  return (
    <main className="container-gutter mx-auto max-w-content py-48">
      <p className={SECTION_LABEL}>DEV ONLY — DESIGN.md §8 / §12 / §13 / §19 / §21</p>
      <h1 className="text-h1">広告の部位（parts）</h1>
      <p className="text-body text-text-secondary mt-16">
        シェル（popup / sticky / interstitial …）はここにはない。ここにあるのは、どのシェルからも使い回す部位だけ。
        全部 presentational で、閉じるタイミングも移動も再出現も持たない。
      </p>
      <p className={`${NOTE} mt-16`}>
        押した回数:{' '}
        <output id="activation-count" data-activation-count={activations}>
          {activations}
        </output>
        （キーボード操作の検査に使う）
      </p>

      <Section title="AdMeta" source="DESIGN.md §5 ad_meta / §13">
        <div className={styles.row}>
          {EMPHASIS_VALUES.map((emphasis) => (
            <Slot key={emphasis} label={`emphasis ${emphasis}`}>
              <AdMeta emphasis={emphasis} />
            </Slot>
          ))}
          <Slot label="Sponsored">
            <AdMeta label={adCopy.label.sponsored} />
          </Slot>
          <Slot label="あなたにおすすめ">
            <AdMeta label={adCopy.label.forYou} />
          </Slot>
          <Slot label="重要なお知らせ">
            <AdMeta label={adCopy.label.notice} emphasis={2} />
          </Slot>
        </div>
      </Section>

      <Section title="AdHeadline / AdBody / AdLegal" source="DESIGN.md §5 / §8">
        <div className={styles.stack}>
          <AdHeadline>あなたのサイト、広告で壊れていませんか？</AdHeadline>
          <AdBody>3秒で診断できます。診断結果はその場で表示されます。</AdBody>
          <AdLegal>{adCopy.legal.fiction}</AdLegal>
        </div>
      </Section>

      <Section title="AdCTA" source="DESIGN.md §12">
        <div className={styles.row}>
          {EMPHASIS_VALUES.map((emphasis) => (
            <Slot key={`primary-${emphasis}`} label={`primary / emphasis ${emphasis}`}>
              <AdCTA label="今すぐ無料で遊ぶ" emphasis={emphasis} onActivate={count} />
            </Slot>
          ))}
          <Slot label="secondary">
            <AdCTA label="サイトを診断する" variant="secondary" onActivate={count} />
          </Slot>
          <Slot label="primary / enabled=false">
            <AdCTA label="まだ押せません" enabled={false} onActivate={count} />
          </Slot>
          <Slot label="secondary / enabled=false">
            <AdCTA label="まだ押せません" variant="secondary" enabled={false} onActivate={count} />
          </Slot>
        </div>
      </Section>

      <Section title="AdCountdown" source="DESIGN_REQ §5.3 B / GAME §15.4">
        <div className={styles.row}>
          <Slot label="3000ms">
            <AdCountdown remainingMs={3000} />
          </Slot>
          <Slot label="700ms">
            <AdCountdown remainingMs={700} />
          </Slot>
          <Slot label="0ms">
            <AdCountdown remainingMs={0} />
          </Slot>
          <Slot label="2700ms / format=sec">
            <AdCountdown remainingMs={2700} format="sec" />
          </Slot>
        </div>
      </Section>

      <Section title="CloseButton" source="DESIGN.md §19 / DESIGN_REQ §5.3 C">
        <p className="text-body text-text-secondary mb-16">
          点線の枠が実際の当たり判定（最小 44×44）。見た目だけが小さくなる。
        </p>
        <div className={`${styles.row} ${styles['show-hitbox']}`}>
          <Slot label="visualScale 1">
            <CloseButton placement="flow" onActivate={count} />
          </Slot>
          <Slot label="visualScale 0.5（Tiny Close）">
            <CloseButton placement="flow" visualScale={0.5} onActivate={count} />
          </Slot>
          <Slot label="enabled=false（カウントダウン中）">
            <CloseButton placement="flow" enabled={false} onActivate={count} />
          </Slot>
          <Slot label="emphasis 0">
            <CloseButton placement="flow" emphasis={0} onActivate={count} />
          </Slot>
          <Slot label="emphasis 2">
            <CloseButton placement="flow" emphasis={2} onActivate={count} />
          </Slot>
          <Slot label="hitboxScale 2">
            <CloseButton placement="flow" visualScale={0.5} hitboxScale={2} onActivate={count} />
          </Slot>
        </div>
      </Section>

      <Section title="FakeCloseButton" source="TASK-013 req.4 / SAFE-05">
        <p className="text-body text-text-secondary mb-16">
          見た目は本物と区別が付かなくてよい。区別が付かないと困るのは支援技術なので、そこには正直に書く。
        </p>
        <div className={`${styles.row} ${styles['show-hitbox']}`}>
          <Slot label={`本物: ${adCopy.close.ariaLabel}`}>
            <CloseButton placement="flow" onActivate={count} />
          </Slot>
          <Slot label={`偽: ${adCopy.fakeClose.ariaLabel}`}>
            <FakeCloseButton placement="flow" onActivate={count} />
          </Slot>
          <Slot label={`囮: ${adCopy.fakeClose.decoyAriaLabel}`}>
            <FakeCloseButton placement="flow" variant="decoy" onActivate={count} />
          </Slot>
          <Slot label="偽 / emphasis 2">
            <FakeCloseButton placement="flow" emphasis={2} onActivate={count} />
          </Slot>
        </div>
      </Section>

      <Section title="AdCreative" source="DESIGN.md §8 anatomy / §17">
        <p className="text-body text-text-secondary mb-16">
          架空の広告素材 4 種。抽象グラフィックは id から決まる（乱数は使わない）。
        </p>
        <ul role="list" className={styles.gallery}>
          {SAMPLE_CREATIVES.map((creative) => (
            <li key={creative.id}>
              <p className={NOTE}>
                {creative.id} / theme: {creative.theme}
              </p>
              <AdCreative creative={creative} instanceId={creative.id} onPartActivate={count} />
            </li>
          ))}
        </ul>
        <p className="text-body text-text-secondary mt-32 mb-16">同じ素材を別テーマで（テーマは色ではなく役割の選択）。</p>
        <ul role="list" className={styles.gallery}>
          {SAMPLE_CREATIVES.map((creative) => (
            <li key={`alt-${creative.id}`}>
              <p className={NOTE}>
                {creative.id} / theme: {ALTERNATE_THEMES[creative.theme]}
              </p>
              <AdCreative
                creative={{ ...creative, theme: ALTERNATE_THEMES[creative.theme] }}
                instanceId={`alt-${creative.id}`}
                onPartActivate={count}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="組み合わせ（シェルは TASK-013A/B/C）" source="DESIGN.md §8 / §16.1">
        <p className="text-body text-text-secondary mb-16">
          部位を重ねると広告になる、という確認だけ。実際の浮かせ方・位置・z 順はシェルが持つ。
        </p>
        <div className={styles.row}>
          <div className={`${styles.popup} shadow-popup`}>
            <AdCreative
              creative={SALE_CREATIVE}
              instanceId="composed-real"
              countdown={{ remainingMs: 2700 }}
              onPartActivate={count}
            />
            <CloseButton instanceId="composed-real" visualScale={0.5} enabled={false} onActivate={count} />
          </div>
          <div className={`${styles.popup} shadow-popup`}>
            <AdCreative creative={APP_CREATIVE} instanceId="composed-fake" onPartActivate={count} />
            <FakeCloseButton instanceId="composed-fake" onActivate={count} />
            <CloseButton instanceId="composed-fake" anchor={{ xPercent: 12, yPercent: 92 }} visualScale={0.5} onActivate={count} />
          </div>
        </div>
      </Section>
    </main>
  )
}

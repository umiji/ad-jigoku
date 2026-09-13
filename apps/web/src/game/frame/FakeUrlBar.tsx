import styles from './frame.module.css'
import { FAKE_HOST, FAKE_SCHEME } from './frameCapabilities'

/**
 * 偽 URL バー（SAFE-12）。実在ドメインを表示しない。スキームは `hell://`。
 * 偽ページ遷移は「同じ記事の別セクションへ遷移したフリ」= path だけ変える。実 URL は変えない。
 */
export function FakeUrlBar({ path }: { path: string }) {
  const clean = path.replace(/^\/+/, '')
  return (
    <div className={styles.urlBar} role="status" aria-label={`ゲーム内の偽アドレスバー: ${FAKE_SCHEME}${FAKE_HOST}/${clean}`} data-testid="fake-url">
      <span className={styles.urlScheme} aria-hidden="true">
        {FAKE_SCHEME}
      </span>
      <span className={styles.urlHost}>{FAKE_HOST}</span>
      <span>/{clean}</span>
    </div>
  )
}

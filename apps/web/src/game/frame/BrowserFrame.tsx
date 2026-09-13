'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { FakeBackButton } from './FakeBackButton'
import { FakeScrollContainer } from './FakeScrollContainer'
import { FakeUrlBar } from './FakeUrlBar'
import styles from './frame.module.css'
import { hasCapability } from './frameCapabilities'

/**
 * BrowserFrame — ゲーム領域を包む偽ブラウザ UI（TASK-014A / DECISIONS_v0.2 §2 / ADR-010）。
 * - 実ブラウザの history / window.scroll には一切触れない（`history.replaceState` すら使わない）
 * - SAFE-12: 既知ブラウザの外観をコピーしない。偽 URL バーに実在ドメインを出さない
 * - モバイルでは枠を最小化（上部の細いバーのみ）。デスクトップでは偽タブも描く
 * - 初回のみ「これはゲーム内の偽ブラウザです」を強調表示する
 */
const NOTICE_STORAGE_KEY = 'ad-jigoku:frame-notice-dismissed'

export type BrowserFrameProps = {
  device: 'mobile' | 'desktop'
  /** 偽 URL の path（記事のセクション等）。実 URL とは無関係 */
  path: string
  children: ReactNode
  /** 偽ブラウザの viewport に固定するレイヤー（広告 / HUD / 結果）。スクロール内容ではなく枠に対して absolute 配置される */
  overlay?: ReactNode
  onFakeNavigate?: (direction: 'back' | 'forward') => void
  onScrollLines?: (deltaLines: number) => void
  scrollRef?: (el: HTMLDivElement | null) => void
  /** テスト用: 初回表示ラベルを常に出す */
  forceNotice?: boolean
}

function readDismissed(): boolean {
  try {
    return globalThis.localStorage?.getItem(NOTICE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function BrowserFrame({ device, path, children, overlay, onFakeNavigate, onScrollLines, scrollRef, forceNotice = false }: BrowserFrameProps) {
  const [noticeVisible, setNoticeVisible] = useState(forceNotice)
  useEffect(() => {
    if (forceNotice) return
    if (!readDismissed()) setNoticeVisible(true)
  }, [forceNotice])
  const dismiss = () => {
    setNoticeVisible(false)
    try {
      globalThis.localStorage?.setItem(NOTICE_STORAGE_KEY, '1')
    } catch {
      /* per-viewer convenience only */
    }
  }

  return (
    <div className={styles.frame} data-testid="browser-frame" data-device={device}>
      <div className={styles.bar} role="toolbar" aria-label="ゲーム内の偽ブラウザ（本物のブラウザ操作には影響しません）">
        <span className={styles.brand}>Hell Browser</span>
        {hasCapability(device, 'back') && (
          <>
            <FakeBackButton direction="back" onNavigate={onFakeNavigate} />
            <FakeBackButton direction="forward" enabled={false} onNavigate={onFakeNavigate} />
          </>
        )}
        {hasCapability(device, 'url') && <FakeUrlBar path={path} />}
        {hasCapability(device, 'tabs') && (
          <div className={styles.tabs} aria-hidden="true">
            <span className={`${styles.tab} ${styles.tabActive}`}>記事</span>
            <span className={styles.tab}>あなたにおすすめ</span>
          </div>
        )}
      </div>
      {noticeVisible && (
        <div className={styles.notice} role="note" data-testid="frame-notice">
          <span>
            <span className={styles.noticeStrong}>これはゲーム内の偽ブラウザです。</span> 本物のブラウザの戻る・URL・スクロールには触れません。
          </span>
          <button type="button" className={styles.noticeDismiss} onClick={dismiss} aria-label="この案内を閉じる">
            OK
          </button>
        </div>
      )}
      <div className={styles.viewport} data-testid="frame-viewport">
        <FakeScrollContainer {...(onScrollLines ? { onScrollLines } : {})} {...(scrollRef ? { scrollRef } : {})}>
          {children}
        </FakeScrollContainer>
        {overlay}
        <span className={styles.badge} aria-hidden="true">
          FAKE BROWSER · IN-GAME
        </span>
      </div>
    </div>
  )
}

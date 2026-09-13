import styles from './hud.module.css'

/**
 * コンボ表示（TASK-016 要件 4）。
 * - 敵側コンボ名（namedCombo）は「やられている」表現（danger）
 * - プレイヤー側 chain は「決まっている」表現（success）。混同しない
 * - RAGE 発動中は warning
 */
export function ComboIndicator({ chain, namedCombo, rageActive, rageLevel }: { chain: number; namedCombo?: string | undefined; rageActive: boolean; rageLevel: number }) {
  return (
    <div className={styles.combo} aria-live="polite" data-testid="combo">
      {namedCombo && (
        <span className={styles.comboEnemy} data-testid="combo-enemy">
          敵コンボ「{namedCombo}」を食らっている
        </span>
      )}
      {namedCombo && chain >= 2 && ' · '}
      {chain >= 2 && (
        <span className={styles.comboChain} data-testid="combo-chain">
          {chain} CHAIN
        </span>
      )}
      {rageActive && (
        <span className={styles.comboRage} data-testid="combo-rage">
          {' '}
          RAGE Lv.{rageLevel}
        </span>
      )}
    </div>
  )
}

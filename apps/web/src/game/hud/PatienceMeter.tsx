import { useEffect, useRef, useState } from 'react'
import styles from './hud.module.css'

export const PATIENCE_LOW = 50
export const PATIENCE_CRITICAL = 25
/** 1 回の更新でこれ以上減ったら「急減」として警告する */
export const PATIENCE_DROP_WARN = 8

/** 忍耐メーター（GAME §5.1 C）。数値ではなくバー。急減時は明確に警告（accent.danger の点滅） */
export function PatienceMeter({ value, max = 100 }: { value: number; max?: number }) {
  const ratio = Math.max(0, Math.min(1, value / max))
  const level = value <= PATIENCE_CRITICAL ? 'critical' : value <= PATIENCE_LOW ? 'low' : 'ok'
  const prev = useRef(value)
  const [dropping, setDropping] = useState(false)
  useEffect(() => {
    if (prev.current - value >= PATIENCE_DROP_WARN) setDropping(true)
    else if (value >= prev.current) setDropping(false)
    prev.current = value
  }, [value])
  return (
    <div>
      <div className={styles.label}>忍耐 PATIENCE</div>
      <div className={styles.meter} role="meter" aria-label="忍耐" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} data-testid="patience-meter">
        <div className={styles.meterFill} data-level={level} data-dropping={dropping ? 'true' : 'false'} style={{ transform: `scaleX(${ratio})` }} />
      </div>
    </div>
  )
}

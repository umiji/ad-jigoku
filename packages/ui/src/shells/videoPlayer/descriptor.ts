import type { ShellDescriptor } from '../types'

/** videoPlayer — 隅に居座る偽の動画プレイヤー（ATT-01 / ATT-02 / OBS-06 の見た目） */
export const videoPlayerDescriptor: ShellDescriptor = {
  id: 'videoPlayer',
  parts: ['label', 'media', 'cta', 'close'],
  supports: ['spawn', 'persist', 'attention'],
}

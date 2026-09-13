import storyTemplates from './templates/story.json'
import stage1 from './stages/stage-1.json'
import type { EncounterTemplate, StageDefinition } from '../types'

/**
 * ステージ定義・テンプレートはデータ（GAME §13）。中身の充実は TASK-026。
 * stage JSON は `templateIds` でテンプレートを参照し、ここで解決する。
 */
export const STORY_TEMPLATES = storyTemplates as EncounterTemplate[]

type StageJson = Omit<StageDefinition, 'templates'> & { templateIds: string[] }

function resolveStage(json: StageJson, templates: readonly EncounterTemplate[]): StageDefinition {
  const { templateIds, ...rest } = json
  const resolved = templateIds.map((id) => {
    const t = templates.find((x) => x.id === id)
    if (!t) throw new Error(`stage "${json.id}": 未知のテンプレート "${id}"`)
    return t
  })
  return { ...rest, templates: resolved }
}

export const STAGES: Record<string, StageDefinition> = {
  'stage-1': resolveStage(stage1 as StageJson, STORY_TEMPLATES),
}

export function getStage(id: string): StageDefinition {
  const s = STAGES[id]
  if (!s) throw new Error(`未知の stageId "${id}"（登録済み: ${Object.keys(STAGES).join(', ')}）`)
  return s
}

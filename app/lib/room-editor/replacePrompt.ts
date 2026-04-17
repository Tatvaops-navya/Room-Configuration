import { EDIT_INPAINT_CLOSURE } from './editCatalogPrompt'

/**
 * Same structure as catalog edit (`buildEditCatalogPrompt`): change one target to a specification,
 * then the shared `EDIT_INPAINT_CLOSURE`. Replace differs only by using the user-drawn mask (where)
 * instead of a full-frame mask.
 */
export function buildReplaceWithPhrase(
  description?: string | null,
  presetId?: string | null
): string {
  const t = description?.trim() || presetId?.trim() || 'a similar object'
  return `Change only the selected object in this interior photo to match this specification: ${t}. ${EDIT_INPAINT_CLOSURE}`
}

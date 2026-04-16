/**
 * Masked replace user instruction — same wording as `buildPreviewPrompt` when `mode === 'replace'`
 * in `runRoomEditorPreview.ts` (preset label / custom text / preset id fallback).
 */
export function buildReplaceWithPhrase(
  description?: string | null,
  presetId?: string | null
): string {
  const t = description?.trim() || presetId?.trim() || 'a similar object'
  return [
    `Replace only the selected object with ${t}`,
    'Keep the original camera, composition, and furniture positions unchanged',
    'Match the existing room style, color palette, lighting, and shadows',
    'Do not change background walls, floor, ceiling, or other furniture outside the selection mask',
  ].join('. ')
}

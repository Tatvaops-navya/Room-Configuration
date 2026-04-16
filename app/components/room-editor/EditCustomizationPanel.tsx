'use client'

import { useEffect, useMemo } from 'react'
import { useRoomEditorStore } from '@/app/lib/room-editor/roomEditorStore'
import { mergeEditComponentList } from '@/app/lib/room-editor/editCatalogUtils'
import type { CatalogVariation, EditAttributeTab } from '@/app/lib/room-editor/types'

const TABS: { id: EditAttributeTab; label: string }[] = [
  { id: 'style', label: 'Style' },
  { id: 'colour', label: 'Colour' },
  { id: 'material', label: 'Material' },
  { id: 'ai', label: 'AI' },
]

function filterByTab(rows: CatalogVariation[], tab: EditAttributeTab): CatalogVariation[] {
  if (tab === 'style' || tab === 'ai') return rows
  if (tab === 'colour') {
    const withColor = rows.filter((r) => r.color && String(r.color).trim().length > 0)
    return withColor.length ? withColor : rows
  }
  if (tab === 'material') {
    const withMat = rows.filter((r) => r.material && String(r.material).trim().length > 0)
    return withMat.length ? withMat : rows
  }
  return rows
}

function tabSubtitle(tab: EditAttributeTab): string {
  switch (tab) {
    case 'style':
      return 'Select style'
    case 'colour':
      return 'Select colour'
    case 'material':
      return 'Select material'
    default:
      return 'Describe change'
  }
}

export default function EditCustomizationPanel({ className = '' }: { className?: string }) {
  const workingImage = useRoomEditorStore((s) => s.workingImage)
  const editDetectedSlugs = useRoomEditorStore((s) => s.editDetectedSlugs)
  const editSelectedItemId = useRoomEditorStore((s) => s.editSelectedItemId)
  const editCatalogCache = useRoomEditorStore((s) => s.editCatalogCache)
  const editCatalogLoading = useRoomEditorStore((s) => s.editCatalogLoading)
  const editCatalogError = useRoomEditorStore((s) => s.editCatalogError)
  const editAttributeTab = useRoomEditorStore((s) => s.editAttributeTab)
  const editPendingVariation = useRoomEditorStore((s) => s.editPendingVariation)
  const editOptions = useRoomEditorStore((s) => s.editOptions)
  const setEditCatalogCacheEntry = useRoomEditorStore((s) => s.setEditCatalogCacheEntry)
  const setEditCatalogLoading = useRoomEditorStore((s) => s.setEditCatalogLoading)
  const setEditCatalogError = useRoomEditorStore((s) => s.setEditCatalogError)
  const setEditAttributeTab = useRoomEditorStore((s) => s.setEditAttributeTab)
  const setEditPendingVariation = useRoomEditorStore((s) => s.setEditPendingVariation)
  const setEditOptions = useRoomEditorStore((s) => s.setEditOptions)
  const confirmEditCatalogCustomization = useRoomEditorStore((s) => s.confirmEditCatalogCustomization)

  const items = useMemo(() => mergeEditComponentList(editDetectedSlugs), [editDetectedSlugs])
  const selectedItem = useMemo(
    () => items.find((i) => i.id === editSelectedItemId) ?? null,
    [items, editSelectedItemId]
  )

  const api = selectedItem?.apiComponent ?? ''
  const cached = api ? editCatalogCache[api] : undefined

  useEffect(() => {
    if (!workingImage || !api) return
    if (cached != null) return

    let cancelled = false
    setEditCatalogLoading(true)
    setEditCatalogError(null)

    fetch(`/api/product-variations?component=${encodeURIComponent(api)}&context=internal`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          const msg = typeof data?.error === 'string' ? data.error : 'Failed to load catalog'
          throw new Error(msg)
        }
        return data
      })
      .then((data: unknown) => {
        if (cancelled) return
        const rows = Array.isArray(data)
          ? (data as CatalogVariation[]).filter((r) => r && typeof r.id === 'string')
          : []
        setEditCatalogCacheEntry(api, rows)
      })
      .catch((e: Error) => {
        if (!cancelled) setEditCatalogError(e.message ?? 'Failed to load catalog')
      })
      .finally(() => {
        if (!cancelled) setEditCatalogLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [workingImage, api, cached, setEditCatalogCacheEntry, setEditCatalogLoading, setEditCatalogError])

  const filtered = useMemo(() => {
    const all = cached ?? []
    return filterByTab(all, editAttributeTab)
  }, [cached, editAttributeTab])

  const confirmDisabled =
    editCatalogLoading ||
    !selectedItem ||
    (editAttributeTab === 'ai' ? !editOptions.text?.trim() : !editPendingVariation)

  const objectTitle = selectedItem ? `${selectedItem.label} — ${tabSubtitle(editAttributeTab)}` : 'Select an object'

  return (
    <aside
      className={className}
      style={{
        minWidth: 280,
        maxWidth: 340,
        padding: '0.75rem',
        borderRadius: 12,
        border: '1px solid var(--color-border, #e2e8f0)',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        alignSelf: 'stretch',
      }}
    >
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setEditAttributeTab(t.id)}
            style={{
              padding: '0.3rem 0.55rem',
              fontSize: '0.78rem',
              borderRadius: 6,
              border: `1px solid ${editAttributeTab === t.id ? '#0d9488' : '#e2e8f0'}`,
              background: editAttributeTab === t.id ? 'rgba(13,148,136,0.12)' : '#f8fafc',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}>{objectTitle}</h3>

      {editCatalogError && (
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#dc2626' }}>{editCatalogError}</p>
      )}

      {editAttributeTab === 'ai' ? (
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, color: '#64748b' }}>
            Prompt
          </label>
          <textarea
            value={editOptions.text ?? ''}
            onChange={(e) => setEditOptions({ text: e.target.value || undefined })}
            placeholder={`e.g. Paint the ${selectedItem?.label.toLowerCase() ?? 'surface'} sage green matte`}
            rows={4}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.85rem',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>
      ) : editCatalogLoading && !cached?.length ? (
        <p className="hint-text" style={{ margin: 0, fontSize: '0.85rem' }}>Loading options…</p>
      ) : !filtered.length ? (
        <p className="hint-text" style={{ margin: 0, fontSize: '0.85rem' }}>
          No presets for this filter. Try another tab.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            maxHeight: 360,
            overflowY: 'auto',
            paddingRight: 2,
          }}
        >
          {filtered.map((row) => {
            const active = editPendingVariation?.id === row.id
            const swatch = row.color?.trim()
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setEditPendingVariation(row)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 6,
                  padding: 8,
                  borderRadius: 10,
                  border: `1px solid ${active ? '#0d9488' : '#e2e8f0'}`,
                  background: active ? 'rgba(13,148,136,0.08)' : '#f8fafc',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    aspectRatio: '1',
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: swatch && /^#?[0-9a-f]{3,8}$/i.test(swatch)
                      ? (swatch.startsWith('#') ? swatch : `#${swatch}`)
                      : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {row.imageUrl ? (
                    <img
                      src={row.imageUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : null}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', lineHeight: 1.25 }}>
                  {row.label}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        <button
          type="button"
          className="button"
          disabled={Boolean(confirmDisabled)}
          style={{
            width: '100%',
            background: '#0d9488',
            borderColor: '#0f766e',
            color: '#fff',
            fontSize: '0.88rem',
            opacity: confirmDisabled ? 0.5 : 1,
          }}
          onClick={() => void confirmEditCatalogCustomization()}
        >
          Confirm customisation
        </button>
        <p className="hint-text" style={{ margin: '0.5rem 0 0', fontSize: '0.72rem' }}>
          Then use <strong>Generate preview</strong> below to see the result.
        </p>
      </div>
    </aside>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRoomEditorStore } from '@/app/lib/room-editor/roomEditorStore'
import { runRoomEditorPreview } from '@/app/lib/room-editor/runRoomEditorPreview'
import type { EditorMode, EditTab, CatalogVariation } from '@/app/lib/room-editor/types'
const EDIT_TABS: { id: EditTab; label: string }[] = [
  { id: 'preset', label: 'Preset' },
  { id: 'ai', label: 'AI' },
  { id: 'replace', label: 'Replace' },
]

function useChairCatalog() {
  const [data, setData] = useState<CatalogVariation[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data || loading) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/product-variations?component=chair&context=internal')
      .then(async (res) => {
        const body = await res.text()
        if (!res.ok) {
          try {
            const parsed = JSON.parse(body) as { error?: string }
            throw new Error(parsed.error || 'Failed to load chair catalog')
          } catch {
            throw new Error('Failed to load chair catalog')
          }
        }
        try {
          const parsed = JSON.parse(body) as CatalogVariation[]
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return [] as CatalogVariation[]
        }
      })
      .then((rows) => {
        if (!cancelled) setData(rows)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || 'Failed to load chair catalog')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [data, loading])

  return { data: data ?? [], loading, error }
}

function useTableCatalog() {
  const [data, setData] = useState<CatalogVariation[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data || loading) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/product-variations?component=table&context=internal')
      .then(async (res) => {
        const body = await res.text()
        if (!res.ok) {
          try {
            const parsed = JSON.parse(body) as { error?: string }
            throw new Error(parsed.error || 'Failed to load table catalog')
          } catch {
            throw new Error('Failed to load table catalog')
          }
        }
        try {
          const parsed = JSON.parse(body) as CatalogVariation[]
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return [] as CatalogVariation[]
        }
      })
      .then((rows) => {
        if (!cancelled) setData(rows)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || 'Failed to load table catalog')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [data, loading])

  return { data: data ?? [], loading, error }
}

const ADD_OBJECT_PRESETS = [
  { id: 'plant', label: 'Indoor plant' },
  { id: 'lamp', label: 'Floor lamp' },
  { id: 'rug', label: 'Area rug' },
  { id: 'painting', label: 'Wall painting' },
  { id: 'bookshelf', label: 'Bookshelf' },
]

function EditTabButtons() {
  const activeEditTab = useRoomEditorStore((s) => s.activeEditTab)
  const setActiveEditTab = useRoomEditorStore((s) => s.setActiveEditTab)

  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: '0.75rem' }}>
      {EDIT_TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setActiveEditTab(t.id)}
          style={{
            padding: '0.35rem 0.65rem',
            fontSize: '0.8rem',
            borderRadius: 6,
            border: `1px solid ${activeEditTab === t.id ? '#0d9488' : '#e2e8f0'}`,
            background: activeEditTab === t.id ? 'rgba(13,148,136,0.12)' : '#fff',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function AddPanel() {
  const addOption = useRoomEditorStore((s) => s.addOption)
  const setAddOption = useRoomEditorStore((s) => s.setAddOption)
  const selection = useRoomEditorStore((s) => s.selection)
  const previewLoading = useRoomEditorStore((s) => s.previewLoading)
  const { data: chairCatalog, loading: chairLoading } = useChairCatalog()
  const { data: tableCatalog, loading: tableLoading } = useTableCatalog()

  const hasMask = Boolean(selection?.maskDataUrl)
  const hasIntent = Boolean(addOption.text?.trim() || addOption.presetId)
  const canAdd = hasMask && hasIntent

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Object presets</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ADD_OBJECT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                borderRadius: 6,
                border: `1px solid ${addOption.presetId === p.id ? '#eab308' : '#e2e8f0'}`,
                background: addOption.presetId === p.id ? 'rgba(234,179,8,0.15)' : '#fff',
              }}
              onClick={() => setAddOption({ presetId: addOption.presetId === p.id ? undefined : p.id, text: p.label })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Describe object</label>
        <input
          type="text"
          placeholder="e.g. Small potted palm"
          value={addOption.text ?? ''}
          onChange={(e) => setAddOption({ text: e.target.value || undefined })}
          style={{
            width: '100%',
            padding: '0.5rem 0.65rem',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: '0.9rem',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
            Chair catalog
          </label>
          {chairLoading && !chairCatalog.length ? (
            <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
              Loading chairs…
            </p>
          ) : !chairCatalog.length ? (
            <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
              No chairs available yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
              {chairCatalog.slice(0, 10).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  style={{
                    padding: '0.3rem 0.55rem',
                    fontSize: '0.78rem',
                    borderRadius: 6,
                    border: `1px solid ${addOption.text === row.label ? '#0d9488' : '#e2e8f0'}`,
                    background: addOption.text === row.label ? 'rgba(13,148,136,0.12)' : '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setAddOption({ text: row.label })}
                >
                  {row.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
            Table catalog
          </label>
          {tableLoading && !tableCatalog.length ? (
            <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
              Loading tables…
            </p>
          ) : !tableCatalog.length ? (
            <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
              No tables available yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
              {tableCatalog.slice(0, 10).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  style={{
                    padding: '0.3rem 0.55rem',
                    fontSize: '0.78rem',
                    borderRadius: 6,
                    border: `1px solid ${addOption.text === row.label ? '#0d9488' : '#e2e8f0'}`,
                    background: addOption.text === row.label ? 'rgba(13,148,136,0.12)' : '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setAddOption({ text: row.label })}
                >
                  {row.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="button"
        disabled={!canAdd || previewLoading}
        style={{
          width: '100%',
          padding: '0.55rem 1rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          background: '#0d9488',
          borderColor: '#0f766e',
          color: '#fff',
        }}
        onClick={() => void runRoomEditorPreview()}
      >
        {previewLoading ? 'Generating preview…' : 'Add'}
      </button>
      {!hasMask && (
        <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
          Please select an area to place the object — draw a box on the image, then pick a preset or describe it.
        </p>
      )}
      {hasMask && !hasIntent && (
        <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
          Choose a preset or type a description, then click <strong>Add</strong> to preview.
        </p>
      )}
      {hasMask && hasIntent && (
        <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#64748b' }}>
          After preview appears in the panel beside this one, click <strong>Apply</strong> there to commit to the main image.
        </p>
      )}
    </div>
  )
}

interface ReplacePanelContentProps {
  option: { presetId?: string; text?: string }
  setOption: (o: { presetId?: string; text?: string }) => void
  presets: { id: string; label: string }[]
}

function ReplacePanelContent({ option, setOption, presets }: ReplacePanelContentProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Replacement presets</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                borderRadius: 6,
                border: `1px solid ${option.presetId === p.id ? '#3b82f6' : '#e2e8f0'}`,
                background: option.presetId === p.id ? 'rgba(59,130,246,0.12)' : '#fff',
              }}
              onClick={() => setOption({ presetId: option.presetId === p.id ? undefined : p.id, text: p.label })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Custom description</label>
        <input
          type="text"
          placeholder="e.g. Similar size oak coffee table"
          value={option.text ?? ''}
          onChange={(e) => setOption({ text: e.target.value || undefined })}
          style={{
            width: '100%',
            padding: '0.5rem 0.65rem',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: '0.9rem',
          }}
        />
      </div>
    </div>
  )
}

function ReplacePanel() {
  const replaceOption = useRoomEditorStore((s) => s.replaceOption)
  const setReplaceOption = useRoomEditorStore((s) => s.setReplaceOption)
  const activeEditTab = useRoomEditorStore((s) => s.activeEditTab)
  const selection = useRoomEditorStore((s) => s.selection)
  const previewLoading = useRoomEditorStore((s) => s.previewLoading)
  const { data: chairCatalog, loading: chairLoading } = useChairCatalog()
  const { data: tableCatalog, loading: tableLoading } = useTableCatalog()

  const hasMask = Boolean(selection?.maskDataUrl)
  const hasIntent =
    activeEditTab === 'ai'
      ? Boolean(replaceOption.text?.trim())
      : Boolean(replaceOption.text?.trim() || replaceOption.presetId)
  const canPreview = hasMask && hasIntent

  const presets = [
    { id: 'modern_sofa', label: 'Modern sofa' },
    { id: 'wooden_table', label: 'Wooden table' },
    { id: 'minimal_desk', label: 'Minimal desk' },
    { id: 'leather_chair', label: 'Leather chair' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <EditTabButtons />
      {(activeEditTab === 'preset' || activeEditTab === 'replace') && (
        <ReplacePanelContent option={replaceOption} setOption={(o) => setReplaceOption(o)} presets={presets} />
      )}
      {activeEditTab === 'ai' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>Describe replacement</label>
          <input
            type="text"
            placeholder="e.g. Similar size oak coffee table"
            value={replaceOption.text ?? ''}
            onChange={(e) => setReplaceOption({ text: e.target.value || undefined })}
            style={{
              width: '100%',
              padding: '0.5rem 0.65rem',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
            Chair catalog
          </label>
          {chairLoading && !chairCatalog.length ? (
            <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
              Loading chairs…
            </p>
          ) : !chairCatalog.length ? (
            <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
              No chairs available yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
              {chairCatalog.slice(0, 10).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  style={{
                    padding: '0.3rem 0.55rem',
                    fontSize: '0.78rem',
                    borderRadius: 6,
                    border: `1px solid ${replaceOption.text === row.label ? '#0d9488' : '#e2e8f0'}`,
                    background: replaceOption.text === row.label ? 'rgba(13,148,136,0.12)' : '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setReplaceOption({ text: row.label })}
                >
                  {row.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
            Table catalog
          </label>
          {tableLoading && !tableCatalog.length ? (
            <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
              Loading tables…
            </p>
          ) : !tableCatalog.length ? (
            <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
              No tables available yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
              {tableCatalog.slice(0, 10).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  style={{
                    padding: '0.3rem 0.55rem',
                    fontSize: '0.78rem',
                    borderRadius: 6,
                    border: `1px solid ${replaceOption.text === row.label ? '#0d9488' : '#e2e8f0'}`,
                    background: replaceOption.text === row.label ? 'rgba(13,148,136,0.12)' : '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setReplaceOption({ text: row.label })}
                >
                  {row.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="button"
        disabled={!canPreview || previewLoading}
        style={{
          width: '100%',
          padding: '0.55rem 1rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          background: '#0d9488',
          borderColor: '#0f766e',
          color: '#fff',
        }}
        onClick={() => void runRoomEditorPreview()}
      >
        {previewLoading ? 'Generating preview…' : 'Preview replace'}
      </button>
      {!hasMask && (
        <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
          Draw a box around the object on the image first.
        </p>
      )}
      {hasMask && !hasIntent && (
        <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
          Set what to replace with, then click <strong>Preview replace</strong>.
        </p>
      )}
    </div>
  )
}

function ErasePanel() {
  const selection = useRoomEditorStore((s) => s.selection)
  const previewLoading = useRoomEditorStore((s) => s.previewLoading)
  const hasMask = Boolean(selection?.maskDataUrl)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p className="hint-text" style={{ margin: 0, fontSize: '0.9rem' }}>
        Draw a box around what to remove. Preview the result, then apply in the panel beside this one.
      </p>
      <button
        type="button"
        className="button"
        disabled={!hasMask || previewLoading}
        style={{
          width: '100%',
          padding: '0.55rem 1rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          background: '#b91c1c',
          borderColor: '#991b1b',
          color: '#fff',
        }}
        onClick={() => void runRoomEditorPreview()}
      >
        {previewLoading ? 'Generating preview…' : 'Preview removal'}
      </button>
      {!hasMask && (
        <p className="hint-text" style={{ fontSize: '0.78rem', margin: 0, color: '#94a3b8' }}>
          Draw a box on the image first.
        </p>
      )}
    </div>
  )
}

interface SidePanelProps {
  className?: string
}

/**
 * Dynamic side panel: different controls per mode.
 */
export default function SidePanel({ className = '' }: SidePanelProps) {
  const mode = useRoomEditorStore((s) => s.mode)

  if (mode === 'idle' || mode === 'edit') return null

  const titles: Record<EditorMode, string> = {
    idle: '',
    edit: '',
    add: 'Add object',
    replace: 'Replace with',
    erase: 'Erase confirmation',
  }

  return (
    <div
      className={className}
      style={{
        padding: '1rem',
        borderRadius: 12,
        border: '1px solid var(--color-border, #e2e8f0)',
        background: '#f8fafc',
        minWidth: 240,
      }}
    >
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#334155' }}>{titles[mode]}</h3>
      {mode === 'add' && <AddPanel />}
      {mode === 'replace' && <ReplacePanel />}
      {mode === 'erase' && <ErasePanel />}
    </div>
  )
}

import { MainCanvas } from './MainCanvas'
import { CutoutPanel } from './CutoutPanel'
import { EditingPanel } from './EditingPanel'

export function MainLayout() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 layout-editor">
      {/* Main canvas: 60% width on desktop */}
      <section
        className="flex-1 min-h-[280px] lg:min-w-0 lg:flex-[1_1_60%] flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--neutral-200)] bg-[var(--neutral-100)] canvas-section"
        aria-label="Main canvas"
      >
        <MainCanvas />
      </section>
      {/* Right sidebar: 40% – cutout preview, info, actions, editing tabs */}
      <aside
        className="w-full lg:w-[40%] lg:max-w-[520px] shrink-0 bg-white border-b lg:border-b-0 border-l-0 lg:border-l border-[var(--neutral-200)] flex flex-col min-h-0 overflow-y-auto sidebar-panel"
        aria-label="Contextual panel"
      >
        <CutoutPanel />
        <EditingPanel />
      </aside>
    </div>
  )
}

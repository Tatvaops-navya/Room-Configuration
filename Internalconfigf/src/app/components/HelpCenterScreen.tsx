import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, Menu, Search, X } from 'lucide-react'

const BG_HERO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBQIBF-t8X5zxBQz0cNJ92ve3vvMPd9mhhnBuKtH5HsgPbXO1Gt-cwOnWCpKcV7x42mycVE96fwl0pZt5u2ZoEkZHXafXZPq8nRRl3-sO8uOYNa2EwsoJ07gFSqltxo4h-trVSzh8e1HkVAlorzPULOKE4MlbeXD6u4iEn-tidoU9v1cRV1dCcmYQmEO2r4GJYJ3ql_PgdjxmNOpjI_t3oLncwTz9U3vgrS3IbRHwDv78TSeduZoFRv7XD4tTXIkc7szEfs2C1ClREm'

const CARD_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBaq13MhL-Y9QRcBSEBnFwhSZZGW_9ZEiLzXdjMfEGzi5r70TD5j2P5O90L7etN47iplXoF6AwsjnhPf3aKb96uXUYSvd1xdTm8vr-jDrAQvOcfahFbR1Imn-tgX3xYm-m-A3Dva5t_oTwEhJVL5y1s5PuwyuXtisbSHPtBmlXukET1syoZ-UoMBSKOujJh7GTrDWholvrEgXeo9qVbZMcI-bk1K5Fwh3PKIndpu8VYj1fqZ2d7u4j894f8mEdxCuF3-d-zW6QcqFji'

type ChipId = 'floor' | 'generation' | 'billing'

type FaqItem = { id: string; q: string; a: string; defaultOpen?: boolean }

type FaqSection = { chips: ChipId[]; title: string; items: FaqItem[] }

const FAQ_SECTIONS: FaqSection[] = [
  {
    chips: ['floor'],
    title: 'Floor Plan Issues',
    items: [
      { id: 'cad', q: 'How do I import existing CAD files?', a: 'Use Upload from the studio home, choose your DWG/DXF or PDF export, then follow the wizard. For best results, flatten layers and use a scale reference TatvaOps can read.' },
      {
        id: 'wall',
        q: 'Wall detection is not accurate',
        a: 'Ensure your scan has consistent lighting. For complex architectural features, try using the manual override tool located in the top-right toolbar during the configuration phase.',
        defaultOpen: true,
      },
    ],
  },
  {
    chips: ['generation'],
    title: 'Design & Generation',
    items: [
      { id: 'mat', q: 'Changing material properties in real-time', a: 'Open the style panel after a generation, pick a surface, and swap materials — previews update on the next render. Save presets to reuse across rooms.' },
      { id: 'limits', q: 'AI generation limits and resets', a: 'Limits follow your plan’s monthly cycle. Unused credits may not roll over depending on plan — check Billing for your current allowance and renewal date.' },
    ],
  },
  {
    chips: ['generation'],
    title: 'Usage & Limits',
    items: [{ id: 'seats', q: 'Workspace collaborator seats', a: 'Collaborator seats are set per workspace in Account settings. Admins can invite or remove members; billing scales with your plan tier.' }],
  },
  {
    chips: ['billing'],
    title: 'Billing Issues',
    items: [
      { id: 'inv', q: 'Where can I download invoices?', a: 'Open Billing & Invoices from the menu, then tap PDF on any paid invoice to download your TatvaOps receipt.' },
      { id: 'pay', q: 'My payment failed — what should I do?', a: 'Update your card under Billing → Payment method. If charges still fail, use Contact Support and we’ll help within 24 hours.' },
    ],
  },
]

export type HelpCenterScreenProps = {
  onBack: () => void
  onToggleMenu: () => void
  menuOpen: boolean
  onContactSupport: () => void
}

export function HelpCenterScreen({ onBack, onToggleMenu, menuOpen, onContactSupport }: HelpCenterScreenProps) {
  const [chip, setChip] = useState<ChipId>('floor')
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const sec of FAQ_SECTIONS) {
      for (const it of sec.items) {
        if (it.defaultOpen) s.add(it.id)
      }
    }
    return s
  })
  const [query, setQuery] = useState('')

  const visibleSections = useMemo(
    () => FAQ_SECTIONS.filter((sec) => sec.chips.includes(chip)),
    [chip],
  )

  const filteredSections = useMemo(() => {
    const t = query.trim().toLowerCase()
    if (!t) return visibleSections
    return visibleSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((it) => it.q.toLowerCase().includes(t) || it.a.toLowerCase().includes(t)),
      }))
      .filter((sec) => sec.items.length > 0)
  }, [visibleSections, query])

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="relative min-h-0 flex-1 bg-[#0f0d0b] font-[family-name:var(--font-manrope,Manrope),ui-sans-serif,system-ui,sans-serif] text-[#e6e0e9]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <img alt="" src={BG_HERO} className="h-full w-full object-cover opacity-20 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-black/80" />
      </div>

      <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-white/10 bg-[#0f0d0b]/80 px-4 backdrop-blur-xl md:h-16">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-full p-1.5 text-white transition-colors hover:bg-white/10"
            aria-label="Back to settings"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <h1 className="truncate text-[18px] font-semibold tracking-tight text-white">Help Center</h1>
        </div>
        <button
          type="button"
          onClick={onToggleMenu}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <main className="relative z-10 mx-auto max-w-[430px] space-y-6 px-4 pb-28 pt-4 md:max-w-lg">
        <section>
          <div className="flex h-12 items-center rounded-2xl border border-white/[0.12] bg-white/[0.05] px-4 backdrop-blur-[20px]">
            <Search size={18} className="mr-3 shrink-0 text-[#cbc4d2]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your issue..."
              className="w-full border-0 bg-transparent text-base text-white placeholder:text-[#948e9c] focus:outline-none focus:ring-0"
            />
          </div>
        </section>

        <section className="-mx-1 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              { id: 'floor' as const, label: 'Floor Plan Issues' },
              { id: 'generation' as const, label: 'Generation Problems' },
              { id: 'billing' as const, label: 'Billing Issues' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setChip(id)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-wide transition-shadow ${
                chip === id
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.2)]'
                  : 'border-white/10 bg-white/5 text-[#cbc4d2]'
              }`}
            >
              {label}
            </button>
          ))}
        </section>

        <section className="space-y-8">
          {filteredSections.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-[#cbc4d2]">
              No articles match your search. Try different keywords or pick another category.
            </p>
          ) : null}
          {filteredSections.map((sec) => (
            <div key={sec.title} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-0.5 rounded-full bg-orange-500" />
                <h2 className="text-lg font-semibold text-white">{sec.title}</h2>
              </div>
              <div className="space-y-3">
                {sec.items.map((it) => {
                  const open = openIds.has(it.id)
                  const accentFloor = sec.title === 'Floor Plan Issues'
                  return (
                    <div
                      key={it.id}
                      className="rounded-2xl border border-white/[0.12] bg-white/[0.05] p-4 backdrop-blur-[20px]"
                    >
                      <button
                        type="button"
                        onClick={() => toggle(it.id)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <span className={`text-base ${open ? 'font-semibold text-[#e6e0e9]' : 'text-[#e6e0e9]'}`}>{it.q}</span>
                        {open ? (
                          <ChevronUp size={22} className="shrink-0 text-orange-500" />
                        ) : (
                          <ChevronDown
                            size={22}
                            className={`shrink-0 ${accentFloor ? 'text-orange-500' : 'text-[#948e9c]'}`}
                          />
                        )}
                      </button>
                      {open ? (
                        <p className="mt-3 border-t border-white/5 pt-3 text-base leading-relaxed text-[#cbc4d2]">{it.a}</p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-6 py-8 text-center">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Still need help?</h3>
            <p className="text-base text-[#cbc4d2]">Our experts are available 24/7</p>
          </div>
          <button
            type="button"
            onClick={onContactSupport}
            className="h-14 w-full rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(251,146,60,0.3)] transition-transform active:scale-[0.98]"
          >
            Contact Support
          </button>
        </section>

        <section className="pb-4">
          <div className="relative h-48 overflow-hidden rounded-3xl border border-white/5">
            <img alt="" src={CARD_IMG} className="h-full w-full object-cover opacity-30 grayscale transition-all duration-700 hover:grayscale-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d0b] to-transparent" />
            <div className="absolute bottom-4 left-6 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">Premium Studio Support</p>
              <p className="text-xl font-semibold text-white">Priority Assistance</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

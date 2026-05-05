'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Bell, Menu, Sparkles, Trophy, Users, Infinity, UsersRound, Gift } from 'lucide-react';

const HERO_ROOM =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCsrvdipvORdCJnUqBClI6sItrDAYQlPepHI4aUa5ttrNgtS8PTS2QkIrxe-JuO8XzPnDxpb40g7-EAfxponlV-27PNLnMwH39uEzbXQfwQFoefkbhGkYW5z3x70DiaHGoVt2tY_wT73PghZJVZGk2b_MkSJ-iR8u_Er3Dc8n2sQuO8dnfUZuGKbUWbsB-8ylmdAZBjUqqORzpNRFM_YmUYT5BqiQk4tV_oDhW6iNCzRlzrYRIHQfnw1CAO2CcdBf6Zr3e4FWfUFnnq';

const THUMB =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC887MVMO9v5h2WWZNFqUgRFmgCgXtMFuCwXHkiQlAW0JE3e1DZfcipzRgFl7NueRGqZuceRT0MKFVGmRG4MV9wT7kozukRyqHwsk859oddaJ0VaUGWoq4P5k7DCPzMCQcjXZkuQETRuwhejrUE6hjIWujajlfpx0TgUkTo2TMdVrxxajMNtlKKF1jTQeunRZQ84yxlAtG3tkiqSYdfF34w7HzpCooloJpwH5dmNedhzbEyMN0LWe73WxLvCeBZM5HruidFZH2PWShj';

const COUNTDOWN_PARTS = [
  { n: '07', l: 'Days' },
  { n: '12', l: 'Hours' },
  { n: '36', l: 'Mins' },
  { n: '48', l: 'Secs' },
] as const;

const FEATURES = [
  { label: 'Anyone', Icon: Users },
  { label: 'Unlimited', Icon: Infinity },
  { label: 'AI Designs', Icon: Sparkles },
  { label: 'Community', Icon: UsersRound },
  { label: 'Rewards', Icon: Gift },
] as const;

const TABS = ['Overview', 'Submissions', 'Leaderboard', 'My Entries'] as const;

const HOW_STEPS = ['Upload', 'Configure', 'Generate', 'Submit', 'Win'] as const;

type ContestScreenProps = {
  onBack: () => void;
  onOpenMenu?: () => void;
};

export function ContestScreen({ onBack, onOpenMenu }: ContestScreenProps) {
  const [activeTab, setActiveTab] = useState(0);

  const timeLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()),
    [],
  );

  return (
    <div className="relative min-h-full bg-[#0B0B0D] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[rgba(255,120,40,0.1)] blur-[110px]" />
        <div className="absolute bottom-32 right-[-48px] h-72 w-72 rounded-full bg-[rgba(236,72,153,0.06)] blur-[100px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[430px] px-5 pb-32">
        {/* STATUS BAR */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 pt-[max(env(safe-area-inset-top),12px)] text-[12px] font-medium tabular-nums tracking-wide text-white/80">
          <span>{timeLabel}</span>
          <div className="flex items-center gap-2 text-[11px] opacity-90">
            <span aria-hidden>📶</span>
            <span aria-hidden>📡</span>
            <span aria-hidden>🔋</span>
          </div>
        </div>

        {/* HEADER */}
        <header className="mt-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-white/[0.09] bg-white/[0.04] text-white backdrop-blur-xl transition-colors hover:bg-white/[0.08]"
              aria-label="Back"
            >
              <ArrowLeft size={19} strokeWidth={2} />
            </button>
            <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white/95">tatva:Ops</div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-[11px] border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl">
              <Bell size={17} className="text-white/88" strokeWidth={2} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500 ring-2 ring-[#0B0B0D]" />
            </div>
            <button
              type="button"
              onClick={() => onOpenMenu?.()}
              className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl transition-colors hover:bg-white/[0.08]"
              aria-label="Menu"
            >
              <Menu size={17} className="text-white/88" strokeWidth={2} />
            </button>
          </div>
        </header>

        {/* TITLE */}
        <section className="mt-8 border-b border-white/[0.05] pb-7">
          <h1 className="text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-white">Contest</h1>
          <p className="mt-3 max-w-[20rem] text-[13px] leading-relaxed text-white/[0.68]">
            Show your <span className="font-medium text-[#fb923c]">creativity</span>. Win exciting rewards.
          </p>
        </section>

        {/* HERO CARD */}
        <section className="mt-8">
          <div className="overflow-hidden rounded-[22px] border border-white/[0.1] bg-white/[0.045] shadow-[0_0_40px_rgba(255,140,0,0.14),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
            <div className="flex min-h-[228px]">
              <div className="flex min-w-0 flex-[1_1_52%] flex-col justify-between gap-4 p-5 pr-3">
                <div>
                  <span className="inline-flex rounded-full border border-orange-400/15 bg-orange-500/[0.14] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-300/95">
                    Active Contest
                  </span>

                  <h2 className="mt-4 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-white">
                    Modern Living Room <br />
                    <span className="text-[#fb923c]">Makeover Challenge</span>
                  </h2>

                  <p className="mt-3 text-[12px] leading-relaxed text-white/[0.62]">
                    Redesign this living room and show us your best version!
                  </p>
                </div>

                <div>
                  <div className="grid grid-cols-4 gap-2">
                    {COUNTDOWN_PARTS.map((t) => (
                      <div
                        key={t.l}
                        className="flex min-h-[46px] flex-col items-center justify-center rounded-[10px] border border-white/[0.06] bg-black/50 px-1 py-2 text-center backdrop-blur-sm"
                      >
                        <div className="text-[12px] font-bold tabular-nums text-[#fb923c]">{t.n}</div>
                        <div className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-white/50">{t.l}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[14px] border border-orange-400/35 bg-black/40 p-3.5 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-white/[0.58]">
                      <Trophy size={14} className="text-orange-300/90" strokeWidth={2} /> Prize Pool
                    </div>
                    <div className="mt-1.5 text-[19px] font-bold tabular-nums tracking-tight text-[#fb923c]">₹1,00,000</div>
                    <div className="mt-1 text-[10px] text-white/50">+ Exciting Goodies</div>
                  </div>
                </div>
              </div>

              <div className="relative min-w-0 flex-[0_0_44%] border-l border-white/[0.06]">
                <img alt="" src={HERO_ROOM} className="h-full min-h-[228px] w-full object-cover" loading="lazy" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#0B0B0D]/88 via-[#0B0B0D]/25 to-transparent" />
                <button
                  type="button"
                  className="absolute bottom-4 right-3 left-3 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#ec4899] py-2.5 text-[11px] font-semibold text-white shadow-[0_8px_24px_rgba(234,88,12,0.35)] transition-transform active:scale-[0.98]"
                >
                  <Sparkles size={14} strokeWidth={2} /> Start Designing →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-8">
          <div className="rounded-[18px] border border-white/[0.09] bg-white/[0.035] px-2 py-4 backdrop-blur-xl">
            <div className="flex items-stretch justify-between gap-0.5">
              {FEATURES.map(({ label, Icon }) => (
                <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-2 px-0.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-400/10 bg-orange-500/[0.12] text-orange-200/95">
                    <Icon size={15} strokeWidth={2} />
                  </div>
                  <span className="text-center text-[9px] font-medium leading-tight tracking-wide text-white/[0.58]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TABS */}
        <section className="mt-8">
          <div
            role="tablist"
            className="flex gap-1 rounded-[14px] border border-white/[0.09] bg-white/[0.035] p-1 backdrop-blur-xl"
          >
            {TABS.map((tab, i) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={i === activeTab}
                onClick={() => setActiveTab(i)}
                className={`min-h-[40px] flex-1 rounded-[10px] px-1.5 text-center text-[10px] font-semibold leading-tight tracking-wide transition-all ${
                  i === activeTab
                    ? 'border border-orange-400/25 bg-orange-500/[0.12] text-[#fdba74] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'border border-transparent text-white/[0.48] hover:bg-white/[0.04] hover:text-white/70'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-8">
          <div className="rounded-[18px] border border-white/[0.09] bg-white/[0.035] px-5 py-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-white/92">How it works</h3>
              <button
                type="button"
                className="shrink-0 text-[12px] font-semibold text-[#fb923c] transition-opacity hover:opacity-90"
              >
                View Rules →
              </button>
            </div>

            <div className="relative pt-6">
              <div
                className="pointer-events-none absolute left-[9%] right-[9%] top-[18px] border-t border-dotted border-white/[0.14]"
                aria-hidden
              />
              <div className="relative flex justify-between gap-1">
                {HOW_STEPS.map((label, i) => (
                  <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-2.5">
                    <div className="relative z-[1] flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#121214] text-[11px] font-bold text-orange-300 shadow-[0_0_0_4px_rgba(11,11,13,0.95)]">
                      {i + 1}
                    </div>
                    <span className="max-w-[4.2rem] text-center text-[9px] font-medium leading-snug text-white/[0.55]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TOP SUBMISSIONS */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-white/92">Top Submissions</h3>
            <button
              type="button"
              className="shrink-0 pb-0.5 text-[12px] font-semibold text-[#fb923c] transition-opacity hover:opacity-90"
            >
              View All →
            </button>
          </div>

          <div className="hide-scrollbar -mx-0.5 flex gap-3.5 overflow-x-auto px-0.5 pb-1">
            {[1, 2, 3, 4].map((i) => (
              <article key={i} className="w-[118px] shrink-0">
                <div className="relative overflow-hidden rounded-[14px] border border-white/[0.08] bg-white/[0.03] shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
                  <img alt="" src={THUMB} className="aspect-[5/4] w-full object-cover" loading="lazy" />
                  <span className="absolute left-2 top-2 rounded-md border border-white/10 bg-black/70 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white/95 backdrop-blur-sm">
                    1.2K
                  </span>
                </div>
                <div className="mt-2.5 text-[11px] font-semibold leading-snug text-white/[0.88]">Modern Serenity</div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/48">
                  <span>Arjun</span>
                  <span aria-hidden className="opacity-80">
                    ❤️
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

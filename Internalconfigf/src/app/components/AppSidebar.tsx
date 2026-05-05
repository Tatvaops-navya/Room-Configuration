/**
 * AppSidebar — global left navigation panel (desktop).
 * Flex layout: consistent icon + label stacks, aligned labels, readable type scale.
 */

import imgImage from 'figma:asset/4e65f32928ec1c24c3d2480d067ce09ec48a2ae5.png';
import svgPaths from '../../imports/svg-ulnieqdr7k';
import svgPathsInterior from '../../imports/svg-5r0w3ksay9';

/** Vertical rhythm between icon+label stacks (~48px + labels — airy on desktop). */
const ITEM_GAP = 'gap-12';

export function AppSidebar() {
  return (
    <div
      className="absolute left-6 top-[78px] z-40 flex w-[104px] flex-col rounded-xl border border-white/[0.15] bg-white/[0.035] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.1),0px_6px_20px_0px_rgba(0,0,0,0.18)] backdrop-blur-[8px]"
      style={{ minHeight: 'min(657px, calc(100vh - 100px))' }}
      data-name="AppSidebar"
    >
      <div className="flex w-full flex-1 flex-col items-stretch overflow-hidden rounded-[inherit] p-2">
        {/* Brand mark */}
        <div className="mb-1 flex shrink-0 justify-center pt-3">
          <img
            alt=""
            className="size-[56px] object-contain mix-blend-screen pointer-events-none"
            src={imgImage}
          />
        </div>

        <nav className={`flex flex-1 flex-col items-center ${ITEM_GAP} px-0.5 pb-4 pt-2`} aria-label="Main">
          {/* Home */}
          <div className="flex w-full flex-col items-center gap-2">
            <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full">
              <div className="relative h-5 w-5">
                <div className="absolute contents inset-[8.34%_12.5%_12.5%_12.5%]">
                  <div className="absolute bottom-[12.5%] left-[37.5%] right-[37.5%] top-1/2">
                    <div className="absolute inset-[-9.72%_-14.58%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.45833 8.95833">
                        <path d={svgPaths.pbd11680} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-[8.34%_12.5%_12.5%_12.5%]">
                    <div className="absolute inset-[-4.61%_-4.86%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.4583 17.2912">
                        <path d={svgPaths.p2e74b980} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex min-h-[32px] w-full items-end justify-center px-0.5">
              <p className="text-center text-[11px] font-medium leading-tight tracking-wide text-white">Home</p>
            </div>
          </div>

          {/* Services */}
          <div className="flex w-full flex-col items-center gap-2">
            <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full">
              <div className="relative h-5 w-5">
                <div className="absolute contents inset-[8.33%_8.33%_16.67%_8.33%]">
                  <div className="absolute inset-[8.33%_33.33%_16.67%_33.33%]">
                    <div className="absolute inset-[-4.86%_-10.94%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.12496 16.4584">
                        <path d={svgPaths.p307fac00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-[16.67%] left-[8.33%] right-[8.33%] top-1/4">
                    <div className="absolute inset-[-6.25%_-4.37%]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.125 13.125">
                        <path d={svgPaths.p3799d780} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex min-h-[32px] w-full items-end justify-center px-0.5">
              <p className="text-center text-[11px] font-medium leading-tight tracking-wide text-white">Services</p>
            </div>
          </div>

          {/* Projects */}
          <div className="flex w-full flex-col items-center gap-2">
            <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full">
              <svg className="h-5 w-5 shrink-0" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                <path
                  d="M2.5 7.5L10 2.5L17.5 7.5V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V7.5Z"
                  stroke="white"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.66667"
                />
                <path d="M7.5 17.5V10H12.5V17.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              </svg>
            </div>
            <div className="flex min-h-[32px] w-full items-end justify-center px-0.5">
              <p className="text-center text-[11px] font-medium leading-tight tracking-wide text-white">Projects</p>
            </div>
          </div>

          {/* Interiors — active */}
          <div className="flex w-full flex-col items-center gap-2">
            <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full">
              <div
                className="h-5 w-5"
                style={{
                  filter:
                    'drop-shadow(0 0 8px rgba(255,255,255,0.70)) drop-shadow(0 0 28px rgba(255,255,255,0.45)) drop-shadow(0 0 60px rgba(255,255,255,0.25))',
                }}
              >
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                  <path d={svgPathsInterior.p7bcef60} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                  <path d="M6.66667 5L8.33333 3.33333" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                  <path d="M15 13.3333L16.6667 11.6667" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                  <path d={svgPathsInterior.p3f3ae0be} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                  <path d={svgPathsInterior.p176d2f80} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                  <path d="M12.5 4.16667L15.8333 7.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                </svg>
              </div>
            </div>
            <div
              className="flex min-h-[32px] w-full items-end justify-center px-0.5"
              style={{
                filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.45)) drop-shadow(0 0 28px rgba(255,255,255,0.22))',
              }}
            >
              <p className="text-center text-[11px] font-medium leading-tight tracking-wide text-white">Interiors</p>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

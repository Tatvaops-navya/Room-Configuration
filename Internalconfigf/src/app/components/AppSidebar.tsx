/**
 * AppSidebar — global left navigation panel.
 * Exact replica of Container38 / Container39 / Container40 from UploadFloorPlan.tsx.
 * Positioned absolute at top-[78px] left-[24px] (header 48px + 30px gap) w-[88px] h-[657px].
 * "Interiors" is always the active item.
 */

import imgImage from 'figma:asset/4e65f32928ec1c24c3d2480d067ce09ec48a2ae5.png';
import svgPaths from '../../imports/svg-ulnieqdr7k';
import svgPathsInterior from '../../imports/svg-5r0w3ksay9';

export function AppSidebar() {
  return (
    /* Container38 */
    <div
      className="absolute bg-[rgba(255,255,255,0.035)] backdrop-blur-[7px] border border-[rgba(255,255,255,0.15)] border-solid h-[657px] left-[24px] rounded-[12px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.1),0px_6px_20px_0px_rgba(0,0,0,0.18)] top-[78px] w-[88px]"
      style={{ zIndex: 40 }}
      data-name="AppSidebar"
    >
      {/* Container38 inner padding wrapper */}
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">

        {/* Container39 — rounded inner + logo + nav */}
        <div className="h-[655px] relative rounded-[16px] shrink-0 w-full">

          {/* Logo image — left-[13px] top-[16px] size-[60px] */}
          <div className="absolute left-[13px] size-[60px] top-[16px]" data-name="Image">
            <img
              alt=""
              className="absolute inset-0 max-w-none object-contain pointer-events-none size-full mix-blend-screen"
              src={imgImage}
            />
          </div>

          {/* Container40 — nav items block */}
          <div
            className="absolute h-[361.938px] left-[19.97px] top-[90px] w-[46.063px]"
            data-name="Container40"
          >

            {/* ── Home (Container41) ─────────────────────────────────────── */}
            <div className="absolute h-[61.188px] left-[2.03px] top-0 w-[42px]" data-name="Container41">
              {/* icon circle */}
              <div className="absolute left-0 rounded-[21px] size-[42px] top-0" data-name="Container42">
                <div className="absolute content-stretch flex flex-col items-start left-[11px] size-[20px] top-[11px]" data-name="Container43">
                  {/* Icon9 / Icon10 — Home SVG */}
                  <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon9">
                    <div className="absolute contents inset-[8.34%_12.5%_12.5%_12.5%]" data-name="Icon10">
                      <div className="absolute bottom-[12.5%] left-[37.5%] right-[37.5%] top-1/2" data-name="Vector">
                        <div className="absolute inset-[-9.72%_-14.58%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.45833 8.95833">
                            <path d={svgPaths.pbd11680} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-[8.34%_12.5%_12.5%_12.5%]" data-name="Vector_2">
                        <div className="absolute inset-[-4.61%_-4.86%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.4583 17.2912">
                            <path d={svgPaths.p2e74b980} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* label */}
              <div className="absolute h-[13.188px] left-[5.31px] top-[48px] w-[31.375px]" data-name="Container44">
                <div className="absolute h-[13.203px] left-0 top-0 w-[31.234px]">
                  <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[16px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px]">
                    Home
                  </p>
                </div>
              </div>
            </div>

            {/* ── Services (Container45) ─────────────────────────────────── */}
            <div className="absolute h-[61.188px] left-0 top-[75.19px] w-[46.063px]" data-name="Container45">
              <div className="absolute left-[2.03px] rounded-[21px] size-[42px] top-0" data-name="Container46">
                <div className="absolute content-stretch flex flex-col items-start left-[11px] size-[20px] top-[11px]" data-name="Container47">
                  {/* Icon11 / Icon12 — Services SVG */}
                  <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon11">
                    <div className="absolute contents inset-[8.33%_8.33%_16.67%_8.33%]" data-name="Icon12">
                      <div className="absolute inset-[8.33%_33.33%_16.67%_33.33%]" data-name="Vector">
                        <div className="absolute inset-[-4.86%_-10.94%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.12496 16.4584">
                            <path d={svgPaths.p307fac00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-[16.67%] left-[8.33%] right-[8.33%] top-1/4" data-name="Vector_2">
                        <div className="absolute inset-[-6.25%_-4.37%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.125 13.125">
                            <path d={svgPaths.p3799d780} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute h-[13.188px] left-0 top-[48px] w-[46.063px]" data-name="Container48">
                <div className="absolute h-[13.203px] left-0 top-0 w-[46.047px]">
                  <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[23px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px]">
                    Services
                  </p>
                </div>
              </div>
            </div>

            {/* ── Projects (Container49) ─────────────────────────────────── */}
            <div className="absolute h-[61.188px] left-[1.03px] top-[150.38px] w-[43.156px]" data-name="Container49">
              <div className="absolute left-px size-[42px] top-0" data-name="Container50">
                <div className="absolute content-stretch flex flex-col items-start left-[11px] size-[20px] top-[11px]" data-name="Container51">
                  {/* Icon13 — Projects SVG */}
                  <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon13">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <g id="Icon">
                        <path
                          d="M2.5 7.5L10 2.5L17.5 7.5V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V7.5Z"
                          stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667"
                        />
                        <path
                          d="M7.5 17.5V10H12.5V17.5"
                          stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667"
                        />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="absolute h-[13.188px] left-[0.47px] top-[48px] w-[43.156px]" data-name="Container52">
                <div className="absolute h-[13.203px] left-0 top-0 w-[43.141px]">
                  <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[22px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px]">
                    Projects
                  </p>
                </div>
              </div>
            </div>

            {/* ── Interiors — ACTIVE with white glow (Container53) ──────── */}
            <div className="absolute h-[61.188px] left-[1.03px] top-[225.56px] w-[44px]" data-name="Container53">
              <div className="absolute left-px size-[42px] top-0" data-name="Container54">
                <div className="absolute content-stretch flex flex-col items-start left-[11px] size-[20px] top-[11px]" data-name="Container55">
                  {/* Icon15 — Interiors SVG with active glow */}
                  <div
                    className="h-[20px] overflow-clip relative shrink-0 w-full"
                    data-name="Icon15"
                    style={{
                      filter:
                        'drop-shadow(0 0 8px rgba(255,255,255,0.70)) drop-shadow(0 0 28px rgba(255,255,255,0.45)) drop-shadow(0 0 60px rgba(255,255,255,0.25))',
                    }}
                  >
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <g id="Icon">
                        <path d={svgPathsInterior.p7bcef60}   stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                        <path d="M6.66667 5L8.33333 3.33333"  stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                        <path d="M15 13.3333L16.6667 11.6667" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                        <path d={svgPathsInterior.p3f3ae0be}  stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                        <path d={svgPathsInterior.p176d2f80}  stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                        <path d="M12.5 4.16667L15.8333 7.5"  stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
              {/* Active label with glow */}
              <div
                className="absolute h-[13.188px] left-0 top-[48px] w-[44px]"
                data-name="Container56"
                style={{
                  filter:
                    'drop-shadow(0 0 18px rgba(255,255,255,0.55)) drop-shadow(0 0 40px rgba(255,255,255,0.28))',
                }}
              >
                <div className="absolute h-[13.203px] left-0 top-0 w-[44.328px]">
                  <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[22.5px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px]">
                    Interiors
                  </p>
                </div>
              </div>
            </div>

          </div>{/* end Container40 */}
        </div>{/* end Container39 */}
      </div>
    </div>
  );
}

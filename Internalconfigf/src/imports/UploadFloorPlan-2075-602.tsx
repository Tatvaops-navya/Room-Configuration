import svgPaths from "./svg-d5pwdjou75";
import imgContainer3Blurred from "figma:asset/cbb61108720d04d2ff8d142ee51098e6c2f1f1ef.png";
import imgImage from "figma:asset/4e65f32928ec1c24c3d2480d067ce09ec48a2ae5.png";

function Container3Blurred() {
  return (
    <div className="absolute blur-[20px] h-[813px] left-0 top-0 w-[1440px]" data-name="Container3Blurred">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgContainer3Blurred} />
    </div>
  );
}

function Container4() {
  return <div className="absolute bg-black h-[813px] left-0 opacity-35 top-0 w-[1440px]" data-name="Container4" />;
}

function Container() {
  return (
    <div className="absolute h-[813px] left-0 top-0 w-[1440px]" data-name="Container">
      <Container3Blurred />
      <Container4 />
    </div>
  );
}

function Image() {
  return (
    <div className="absolute left-[13px] size-[60px] top-[16px]" data-name="Image">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
    </div>
  );
}

function Icon4() {
  return (
    <div className="h-[8.938px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[8.14%_11.29%]" data-name="Vector">
        <div className="absolute inset-[-9.72%_-14.59%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.43816 8.93685">
            <path d={svgPaths.p15e99340} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45428" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container91() {
  return (
    <div className="absolute content-stretch flex flex-col h-[8.938px] items-start left-[6.78px] top-[9.28px] w-[6.438px]" data-name="Container">
      <Icon4 />
    </div>
  );
}

function Icon5() {
  return (
    <div className="h-[17.281px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[4.22%_4.43%]" data-name="Vector">
        <div className="absolute inset-[-4.6%_-4.86%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.4381 17.2808">
            <path d={svgPaths.p2db79380} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45699" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container92() {
  return (
    <div className="absolute content-stretch flex flex-col h-[17.281px] items-start left-[1.78px] top-[0.94px] w-[16.438px]" data-name="Container">
      <Icon5 />
    </div>
  );
}

function Container90() {
  return (
    <div className="absolute left-0 overflow-clip size-[20px] top-0" data-name="Container">
      <Container91 />
      <Container92 />
    </div>
  );
}

function Container89() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Container90 />
    </div>
  );
}

function Container88() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 pt-[11px] px-[11px] rounded-[21px] size-[42px] top-0" data-name="Container">
      <Container89 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[13.203px] left-[5.68px] top-[47px] w-[31.234px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[16px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px] whitespace-nowrap">Home</p>
    </div>
  );
}

function Container87() {
  return (
    <div className="absolute h-[61.188px] left-[2.02px] top-0 w-[42px]" data-name="Container">
      <Container88 />
      <Paragraph />
    </div>
  );
}

function Icon6() {
  return (
    <div className="h-[16.453px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[4.43%_8.97%]" data-name="Vector">
        <div className="absolute inset-[-4.86%_-10.94%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.12476 16.4533">
            <path d={svgPaths.p910e780} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4581" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container97() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16.453px] items-start left-[5.94px] top-[0.94px] w-[8.125px]" data-name="Container">
      <Icon6 />
    </div>
  );
}

function Icon7() {
  return (
    <div className="h-[13.109px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[5.56%_4.02%]" data-name="Vector">
        <div className="absolute inset-[-6.25%_-4.37%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.1241 13.1103">
            <path d={svgPaths.p30ae2080} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45746" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container98() {
  return (
    <div className="absolute content-stretch flex flex-col h-[13.109px] items-start left-[0.94px] top-[4.28px] w-[18.125px]" data-name="Container">
      <Icon7 />
    </div>
  );
}

function Container96() {
  return (
    <div className="absolute left-0 overflow-clip size-[20px] top-0" data-name="Container">
      <Container97 />
      <Container98 />
    </div>
  );
}

function Container95() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Container96 />
    </div>
  );
}

function Container94() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[2.02px] pt-[11px] px-[11px] rounded-[21px] size-[42px] top-0" data-name="Container">
      <Container95 />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute h-[13.203px] left-[-0.02px] top-[47px] w-[46.047px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[23px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px] whitespace-nowrap">Services</p>
    </div>
  );
}

function Container93() {
  return (
    <div className="absolute h-[61.188px] left-0 top-[75.19px] w-[46.063px]" data-name="Container">
      <Container94 />
      <Paragraph1 />
    </div>
  );
}

function Icon9() {
  return (
    <div className="absolute contents inset-[12.5%]" data-name="Icon">
      <div className="absolute inset-[12.5%]" data-name="Vector">
        <div className="absolute inset-[-5.56%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.6667 16.6667">
            <path d={svgPaths.p3c1eb270} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[12.5%] left-[37.5%] right-[37.5%] top-1/2" data-name="Vector">
        <div className="absolute inset-[-11.11%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.66667 9.16667">
            <path d={svgPaths.p2114aa00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Icon8() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Icon9 />
    </div>
  );
}

function Container101() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip size-[20px] top-0" data-name="Container">
      <Icon8 />
    </div>
  );
}

function Container100() {
  return (
    <div className="absolute left-[12px] size-[20px] top-[11px]" data-name="Container">
      <Container101 />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[13.203px] left-[0.71px] top-[47px] w-[43.516px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[22px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px] whitespace-nowrap">Projects</p>
    </div>
  );
}

function Container99() {
  return (
    <div className="absolute h-[61.188px] left-[1.02px] top-[150.38px] w-[43.141px]" data-name="Container">
      <Container100 />
      <Paragraph2 />
    </div>
  );
}

function Icon11() {
  return (
    <div className="absolute contents inset-[8.33%_8.31%_8.31%_8.33%]" data-name="Icon">
      <div className="absolute inset-[8.33%_45.83%_45.83%_8.33%]" data-name="Vector">
        <div className="absolute inset-[-6.63%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.3834 10.3834">
            <path d={svgPaths.p102d0d40} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-3/4 left-[33.33%] right-[58.33%] top-[16.67%]" data-name="Vector">
        <div className="absolute inset-[-36.46%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.88194 2.88195">
            <path d={svgPaths.p280798e0} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[33.33%] left-3/4 right-[16.67%] top-[58.33%]" data-name="Vector">
        <div className="absolute inset-[-36.46%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.88198 2.88188">
            <path d={svgPaths.p1a899a50} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[45.83%_8.31%_8.31%_45.83%]" data-name="Vector">
        <div className="absolute inset-[-6.63%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.3861 10.3861">
            <path d={svgPaths.p20cb52c0} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[8.33%_8.33%_8.34%_8.33%]" data-name="Vector">
        <div className="absolute inset-[-3.65%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.8818 17.8816">
            <path d={svgPaths.p18d52c00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[20.83%_20.83%_62.5%_62.5%]" data-name="Vector">
        <div className="absolute inset-[-18.23%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.54858 4.54861">
            <path d={svgPaths.p39140700} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Icon10() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Icon11 />
    </div>
  );
}

function Container104() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip shadow-[0px_0px_16px_0px_rgba(255,255,255,0.7),0px_0px_56px_0px_rgba(255,255,255,0.45),0px_0px_120px_0px_rgba(255,255,255,0.25)] size-[20px] top-0" data-name="Container">
      <Icon10 />
    </div>
  );
}

function Container103() {
  return (
    <div className="absolute left-[12px] size-[20px] top-[11px]" data-name="Container">
      <Container104 />
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[13.203px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[22.5px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px] whitespace-nowrap">Interiors</p>
    </div>
  );
}

function Container105() {
  return (
    <div className="absolute content-stretch flex flex-col h-[13.188px] items-start left-0 pl-[0.336px] pr-[-0.664px] pt-[-1px] shadow-[0px_0px_36px_0px_rgba(255,255,255,0.55),0px_0px_80px_0px_rgba(255,255,255,0.28)] top-[48px] w-[44px]" data-name="Container">
      <Paragraph3 />
    </div>
  );
}

function Container102() {
  return (
    <div className="absolute h-[61.188px] left-[1.02px] top-[225.55px] w-[44px]" data-name="Container">
      <Container103 />
      <Container105 />
    </div>
  );
}

function Container86() {
  return (
    <div className="absolute h-[361.938px] left-[19.97px] top-[90px] w-[46.063px]" data-name="Container">
      <Container87 />
      <Container93 />
      <Container99 />
      <Container102 />
    </div>
  );
}

function Container85() {
  return (
    <div className="absolute h-[655px] left-px rounded-[16px] top-px w-[84px]" data-name="Container">
      <Image />
      <Container86 />
    </div>
  );
}

function Container84() {
  return (
    <div className="h-[655px] overflow-clip relative rounded-[12px] shrink-0 w-full" data-name="Container">
      <Container85 />
    </div>
  );
}

function AppSidebar() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.04)] content-stretch flex flex-col h-[657px] items-start left-[24px] p-px rounded-[12px] top-[78px] w-[88px]" data-name="AppSidebar">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.15)] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_0px_0px_0px_rgba(0,0,0,0.1),0px_6px_20px_0px_rgba(0,0,0,0.18)]" />
      <Container84 />
    </div>
  );
}

function Icon12() {
  return (
    <div className="absolute left-[10px] size-[15px] top-[7.25px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <g id="Icon">
          <path d={svgPaths.p3968a580} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.58" strokeWidth="1.25" />
          <path d="M11.875 7.5H3.125" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.58" strokeWidth="1.25" />
        </g>
      </svg>
    </div>
  );
}

function Button7() {
  return (
    <div className="h-[29.5px] relative rounded-[9px] shrink-0 w-[73.531px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon12 />
        <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[19.5px] left-[48.5px] not-italic text-[13px] text-[rgba(255,255,255,0.58)] text-center top-[5px] whitespace-nowrap">Back</p>
      </div>
    </div>
  );
}

function Container106() {
  return (
    <div className="h-[29.5px] relative shrink-0 w-[80px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Button7 />
      </div>
    </div>
  );
}

function Text() {
  return (
    <div className="flex-[1_0_0] h-[22.5px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[22.5px] left-0 not-italic text-[#ec4899] text-[15px] top-[-2px] tracking-[-0.45px] whitespace-nowrap">tatva</p>
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[32.313px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[22.5px] left-0 not-italic text-[15px] text-[rgba(255,255,255,0.82)] top-[-2px] tracking-[-0.45px] whitespace-nowrap">:Ops</p>
      </div>
    </div>
  );
}

function Container108() {
  return (
    <div className="flex-[1_0_0] h-[22.5px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <Text />
        <Text1 />
      </div>
    </div>
  );
}

function Icon13() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p100e7280} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.62" strokeWidth="1.16667" />
          <path d={svgPaths.p38a00300} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.62" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function Container109() {
  return (
    <div className="relative rounded-[15px] shrink-0 size-[30px]" data-name="Container" style={{ backgroundImage: "linear-gradient(135deg, rgb(55, 65, 81) 0%, rgb(31, 41, 55) 100%)" }}>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.13)] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[8px] py-px relative size-full">
        <Icon13 />
      </div>
    </div>
  );
}

function Container107() {
  return (
    <div className="h-[30px] relative shrink-0 w-[111.688px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[14px] items-center relative size-full">
        <Container108 />
        <Container109 />
      </div>
    </div>
  );
}

function AppHeader() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.03)] content-stretch flex h-[48px] items-center justify-between left-0 pb-px px-[40px] top-0 w-[1440px]" data-name="AppHeader">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.1)] border-b border-solid inset-0 pointer-events-none shadow-[0px_4px_18px_0px_rgba(0,0,0,0.15)]" />
      <Container106 />
      <Container107 />
    </div>
  );
}

export default function UploadFloorPlan() {
  return (
    <div className="relative size-full" data-name="UploadFloorPlan">
      <Container />
      <AppSidebar />
      <AppHeader />
    </div>
  );
}

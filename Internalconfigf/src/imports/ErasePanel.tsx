import svgPaths from "./svg-ld98ggv8ny";
import imgApp from "figma:asset/cbb61108720d04d2ff8d142ee51098e6c2f1f1ef.png";
import imgImageWall from "figma:asset/45c4e63d4e1bdf6b23c4cb3131fe7883aecdf5e4.png";
import imgImageFloor from "figma:asset/0b9bbe8c1b35fb3aaa140ef4d0c5423aeb68f0c4.png";
import imgImageCeiling from "figma:asset/70376ff0e667a6f2c7a3fcbe34551f2f21aa1f0c.png";
import imgImageSofa from "figma:asset/01c0ad7a95b5f12b13a4994a9b246393bd7c5d2c.png";
import imgImageSelectedArea from "figma:asset/6c98edd2a2423b3a1e6a1725e7e100a5b0253650.png";
import imgImage from "figma:asset/4e65f32928ec1c24c3d2480d067ce09ec48a2ae5.png";

function App() {
  return (
    <div className="absolute h-[813px] left-0 top-0 w-[1440px]" data-name="App">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgApp} />
    </div>
  );
}

function App1() {
  return <div className="absolute bg-[rgba(0,0,0,0.37)] h-[813px] left-0 top-0 w-[1440px]" data-name="App" />;
}

function Container3Blurred() {
  return (
    <div className="absolute blur-[20px] h-[813px] left-0 top-0 w-[1440px]" data-name="Container3Blurred">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgApp} />
    </div>
  );
}

function Container4() {
  return <div className="absolute bg-black h-[813px] left-0 opacity-35 top-0 w-[1440px]" data-name="Container4" />;
}

function Text() {
  return (
    <div className="absolute h-[19.5px] left-[38.97px] top-0 w-[40.047px]" data-name="Text">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[19.5px] left-0 not-italic text-[13px] text-white top-0 whitespace-nowrap">{`Objects `}</p>
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute bg-white h-[2px] left-[43px] rounded-[1px] top-[28px] w-[40px]" data-name="Container">
      <div className="content-stretch flex flex-col items-start pt-[5px] size-full" />
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute h-[29.5px] left-[16px] top-[12px] w-[118px]" data-name="Container">
      <Text />
      <Container5 />
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[44.219px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[13px] text-[rgba(255,255,255,0.4)] top-0 whitespace-nowrap">History</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-stretch flex flex-col h-[29.5px] items-center left-[134px] top-[12px] w-[118px]" data-name="Container">
      <Text1 />
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[42.5px] relative shrink-0 w-[268px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.1)] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container3 />
        <Container6 />
      </div>
    </div>
  );
}

function ImageWall() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Image (Wall)">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageWall} />
    </div>
  );
}

function Container9() {
  return (
    <div className="bg-[rgba(255,255,255,0.08)] relative rounded-[8px] shrink-0 size-[36px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <ImageWall />
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[25.172px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[13px] text-[rgba(255,255,255,0.75)] top-0 whitespace-nowrap">Wall</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute content-stretch flex gap-[12px] h-[56px] items-center left-0 pb-px pl-[16px] top-0 w-[268px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.06)] border-b border-solid inset-0 pointer-events-none" />
      <Container9 />
      <Text2 />
    </div>
  );
}

function ImageFloor() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Image (Floor)">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageFloor} />
    </div>
  );
}

function Container11() {
  return (
    <div className="bg-[rgba(255,255,255,0.08)] relative rounded-[8px] shrink-0 size-[36px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <ImageFloor />
      </div>
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[31.063px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[13px] text-[rgba(255,255,255,0.75)] top-0 whitespace-nowrap">Floor</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="absolute content-stretch flex gap-[12px] h-[56px] items-center left-0 pb-px pl-[16px] top-[56px] w-[268px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.06)] border-b border-solid inset-0 pointer-events-none" />
      <Container11 />
      <Text3 />
    </div>
  );
}

function ImageCeiling() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Image (Ceiling)">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageCeiling} />
    </div>
  );
}

function Container13() {
  return (
    <div className="bg-[rgba(255,255,255,0.08)] relative rounded-[8px] shrink-0 size-[36px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <ImageCeiling />
      </div>
    </div>
  );
}

function Text4() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[41.813px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[13px] text-[rgba(255,255,255,0.75)] top-0 whitespace-nowrap">Ceiling</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute content-stretch flex gap-[12px] h-[56px] items-center left-0 pb-px pl-[16px] top-[112px] w-[268px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.06)] border-b border-solid inset-0 pointer-events-none" />
      <Container13 />
      <Text4 />
    </div>
  );
}

function ImageSofa() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Image (Sofa)">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageSofa} />
    </div>
  );
}

function Container15() {
  return (
    <div className="bg-[rgba(255,255,255,0.08)] relative rounded-[8px] shrink-0 size-[36px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <ImageSofa />
      </div>
    </div>
  );
}

function Text5() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[27.875px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[13px] text-[rgba(255,255,255,0.75)] top-0 whitespace-nowrap">Sofa</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute content-stretch flex gap-[12px] h-[56px] items-center left-0 pb-px pl-[16px] top-[168px] w-[268px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.06)] border-b border-solid inset-0 pointer-events-none" />
      <Container15 />
      <Text5 />
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute h-[34.5px] left-0 top-0 w-[236px]" data-name="Container">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-0 not-italic text-[11px] text-[rgba(255,255,255,0.45)] top-[12px] whitespace-nowrap">Selected Area</p>
    </div>
  );
}

function ImageSelectedArea() {
  return (
    <div className="absolute left-[16px] pointer-events-none rounded-[8px] size-[204px] top-[34.5px]" data-name="Image (Selected area)">
      <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[8px] size-full" src={imgImageSelectedArea} />
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.15)] border-solid inset-0 rounded-[8px]" />
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute h-[15px] left-0 top-[242.5px] w-[236px]" data-name="Container">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[15px] left-[118.48px] not-italic text-[10px] text-[rgba(255,255,255,0.35)] text-center top-0 whitespace-nowrap">390 × 241 px</p>
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute h-[257.5px] left-[16px] top-[244px] w-[236px]" data-name="Container">
      <Container17 />
      <ImageSelectedArea />
      <Container18 />
    </div>
  );
}

function Button() {
  return (
    <div className="absolute bg-black border border-solid border-white h-[44px] left-[16px] rounded-[8px] shadow-[0px_2px_12px_0px_rgba(0,0,0,0.22)] top-[553px] w-[225px]" data-name="Button">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[19.5px] left-[111.69px] not-italic text-[13px] text-center text-white top-[11.25px] tracking-[-0.1px] whitespace-nowrap">Confirm Customisation</p>
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[612.5px] relative shrink-0 w-[268px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Container8 />
        <Container10 />
        <Container12 />
        <Container14 />
        <Container16 />
        <Button />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.22)] h-[657px] left-0 rounded-[16px] top-0 w-[270px]" data-name="Container">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        <Container2 />
        <Container7 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.08)] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.4)]" />
    </div>
  );
}

function IconRegenerate() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconRegenerate">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconRegenerate">
          <path d={svgPaths.p25182e80} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" strokeWidth="1.16667" />
          <path d="M1.75 1.75V4.66667H4.66667" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function Text6() {
  return (
    <div className="flex-[1_0_0] h-[18px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-0 not-italic text-[12px] text-[rgba(255,255,255,0.85)] top-0 whitespace-nowrap">Regenerate</p>
      </div>
    </div>
  );
}

function ToolbarButton() {
  return (
    <div className="absolute content-stretch flex gap-[6px] h-[38px] items-center left-px px-[18px] top-0 w-[122.219px]" data-name="ToolbarButton">
      <IconRegenerate />
      <Text6 />
    </div>
  );
}

function ToolbarDivider() {
  return <div className="absolute bg-[rgba(255,255,255,0.15)] h-[24px] left-[123.22px] top-[7px] w-px" data-name="ToolbarDivider" />;
}

function IconShare() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconShare">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconShare">
          <path d={svgPaths.p275cd40} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" strokeWidth="1.16667" />
          <path d={svgPaths.p2ff82b00} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" strokeWidth="1.16667" />
          <path d={svgPaths.p8612e80} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" strokeWidth="1.16667" />
          <path d={svgPaths.p34971280} id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" strokeWidth="1.16667" />
          <path d={svgPaths.p2b492880} id="Vector_5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function Text7() {
  return (
    <div className="flex-[1_0_0] h-[18px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-0 not-italic text-[12px] text-[rgba(255,255,255,0.85)] top-0 whitespace-nowrap">Share</p>
      </div>
    </div>
  );
}

function ToolbarButton1() {
  return (
    <div className="absolute content-stretch flex gap-[6px] h-[38px] items-center left-[124.22px] px-[18px] top-0 w-[89.203px]" data-name="ToolbarButton">
      <IconShare />
      <Text7 />
    </div>
  );
}

function ToolbarDivider1() {
  return <div className="absolute bg-[rgba(255,255,255,0.15)] h-[24px] left-[213.42px] top-[7px] w-px" data-name="ToolbarDivider" />;
}

function IconLike() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconLike">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconLike">
          <path d={svgPaths.p168026f2} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function Text8() {
  return (
    <div className="flex-[1_0_0] h-[18px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-0 not-italic text-[12px] text-[rgba(255,255,255,0.85)] top-0 whitespace-nowrap">Like</p>
      </div>
    </div>
  );
}

function ToolbarButton2() {
  return (
    <div className="absolute content-stretch flex gap-[6px] h-[38px] items-center left-[214.42px] px-[18px] top-0 w-[79.219px]" data-name="ToolbarButton">
      <IconLike />
      <Text8 />
    </div>
  );
}

function ToolbarDivider2() {
  return <div className="absolute bg-[rgba(255,255,255,0.15)] h-[24px] left-[293.64px] top-[7px] w-px" data-name="ToolbarDivider" />;
}

function IconDownload() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="IconDownload">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="IconDownload">
          <path d={svgPaths.p34aacb00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" strokeWidth="1.16667" />
          <path d={svgPaths.p27169580} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" strokeWidth="1.16667" />
          <path d="M7 8.75V1.75" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function Text9() {
  return (
    <div className="flex-[1_0_0] h-[18px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-0 not-italic text-[12px] text-[rgba(255,255,255,0.85)] top-0 whitespace-nowrap">Download</p>
      </div>
    </div>
  );
}

function ToolbarButton3() {
  return (
    <div className="absolute content-stretch flex gap-[6px] h-[38px] items-center left-[294.64px] px-[18px] top-0 w-[113.313px]" data-name="ToolbarButton">
      <IconDownload />
      <Text9 />
    </div>
  );
}

function Container22() {
  return (
    <div className="bg-[rgba(0,0,0,0.65)] flex-[1_0_0] h-[26.5px] min-h-px min-w-px relative rounded-[8px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.15)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Light',sans-serif] font-light leading-[16.5px] left-[11px] not-italic text-[11px] text-[rgba(255,255,255,0.95)] top-[5px] whitespace-nowrap">Mediterranean</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute content-stretch flex h-[27px] items-center left-[886.14px] top-[5.75px] w-[97px]" data-name="Container">
      <Container22 />
    </div>
  );
}

function Container20() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.22)] border-[rgba(255,255,255,0.15)] border-b border-solid h-[39px] left-0 top-0 w-[993px]" data-name="Container">
      <ToolbarButton />
      <ToolbarDivider />
      <ToolbarButton1 />
      <ToolbarDivider1 />
      <ToolbarButton2 />
      <ToolbarDivider2 />
      <ToolbarButton3 />
      <Container21 />
    </div>
  );
}

function Container24() {
  return <div className="absolute border border-[rgba(255,255,255,0.9)] border-solid h-[240.984px] left-[413px] top-[308px] w-[288.266px]" data-name="Container" />;
}

function Container25() {
  return (
    <div className="absolute bg-[rgba(180,0,0,0.75)] border border-[rgba(255,80,80,0.4)] border-solid h-[28.5px] right-[8.92px] rounded-[20px] top-[12px] w-[113.078px]" data-name="Container">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[12px] not-italic text-[11px] text-white top-[5px] whitespace-nowrap">Cancel Selection</p>
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.7)] h-[25px] left-[613px] rounded-[4px] top-[273px] w-[88px]" data-name="Container">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[8px] not-italic text-[11px] text-white top-[4px] whitespace-nowrap">Area selected</p>
    </div>
  );
}

function ImageGeneratedRoom() {
  return (
    <div className="h-[616px] overflow-clip relative shrink-0 w-full" data-name="Image (Generated Room)">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgApp} />
      <Container24 />
      <Container25 />
      <Container26 />
    </div>
  );
}

function Container23() {
  return (
    <div className="absolute content-stretch flex flex-col h-[616px] items-start left-0 overflow-clip rounded-bl-[12px] rounded-br-[12px] top-[39px] w-[993px]" data-name="Container">
      <ImageGeneratedRoom />
    </div>
  );
}

function CustomTabIconEdit() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="CustomTabIconEdit">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_4282_935)" id="CustomTabIconEdit">
          <path d={svgPaths.p2fe55400} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45" strokeWidth="1.2" />
        </g>
        <defs>
          <clipPath id="clip0_4282_935">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container28() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <CustomTabIconEdit />
      </div>
    </div>
  );
}

function Text10() {
  return (
    <div className="h-[15px] relative shrink-0 w-[18.203px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[15px] left-0 not-italic text-[10px] text-[rgba(255,255,255,0.45)] top-0 whitespace-nowrap">Edit</p>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[50px] items-center left-[21.45px] pt-[15px] top-[10px] w-[18.203px]" data-name="Container">
      <Container28 />
      <Text10 />
    </div>
  );
}

function CustomTabIconAdd() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="CustomTabIconAdd">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="CustomTabIconAdd">
          <path d={svgPaths.p16cc5000} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
}

function Container30() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <CustomTabIconAdd />
      </div>
    </div>
  );
}

function Text11() {
  return (
    <div className="h-[15px] relative shrink-0 w-[53.234px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[15px] left-0 not-italic text-[10px] text-[rgba(255,255,255,0.45)] top-0 whitespace-nowrap">Add Object</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[50px] items-center left-[61.11px] pt-[15px] top-[10px] w-[53.234px]" data-name="Container">
      <Container30 />
      <Text11 />
    </div>
  );
}

function CustomTabIconReplace() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="CustomTabIconReplace">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="CustomTabIconReplace">
          <path d={svgPaths.p31091c00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45" strokeWidth="1.2" />
          <path d={svgPaths.p5686c80} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45" strokeWidth="1.2" />
          <path d={svgPaths.p2f885bd0} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45" strokeWidth="1.2" />
          <path d={svgPaths.p1b7afd8} id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
}

function Container32() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <CustomTabIconReplace />
      </div>
    </div>
  );
}

function Text12() {
  return (
    <div className="h-[15px] relative shrink-0 w-[37.672px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[15px] left-0 not-italic text-[10px] text-[rgba(255,255,255,0.45)] top-0 whitespace-nowrap">Replace</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] h-[50px] items-center left-[135.8px] pt-[15px] top-[10px] w-[37.672px]" data-name="Container">
      <Container32 />
      <Text12 />
    </div>
  );
}

function Text13() {
  return (
    <div className="absolute h-[15px] left-0 top-[35px] w-[26.75px]" data-name="Text">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[15px] left-0 not-italic text-[10px] text-white top-0 whitespace-nowrap">Erase</p>
    </div>
  );
}

function CustomTabIconErase() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="CustomTabIconErase">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="CustomTabIconErase">
          <path d={svgPaths.p1027ea80} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
          <path d="M2 4.6664H14" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
          <path d={svgPaths.p2661600} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
}

function Container34() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[5.38px] shadow-[0px_0px_4px_0px_rgba(255,255,255,0.6),0px_0px_8px_0px_rgba(255,255,255,0.25)] size-[16px] top-[15px]" data-name="Container">
      <CustomTabIconErase />
    </div>
  );
}

function Container35() {
  return <div className="absolute bg-white h-[3px] left-[3.38px] rounded-[2px] top-[-4px] w-[20px]" data-name="Container" />;
}

function Container33() {
  return (
    <div className="absolute h-[50px] left-[194.92px] top-[10px] w-[26.75px]" data-name="Container">
      <Text13 />
      <Container34 />
      <Container35 />
    </div>
  );
}

function CustomisationTabBar() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.35)] border border-[rgba(255,255,255,0.12)] border-solid h-[72px] left-[373.91px] rounded-[14px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.5)] top-[619px] w-[245.188px]" data-name="CustomisationTabBar">
      <Container27 />
      <Container29 />
      <Container31 />
      <Container33 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0.5px_0px_0px_rgba(255,255,255,0.08)]" />
    </div>
  );
}

function Container19() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.22)] border border-[rgba(255,255,255,0.08)] border-solid h-[657px] left-[282px] rounded-[12px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.4)] top-0 w-[995px]" data-name="Container">
      <Container20 />
      <Container23 />
      <CustomisationTabBar />
    </div>
  );
}

function GenerationResults() {
  return (
    <div className="absolute h-[657px] left-[127px] top-[78px] w-[1289px]" data-name="GenerationResults">
      <Container1 />
      <Container19 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute h-[813px] left-0 top-0 w-[1440px]" data-name="Container">
      <Container3Blurred />
      <Container4 />
      <GenerationResults />
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

function Icon() {
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

function Container43() {
  return (
    <div className="absolute content-stretch flex flex-col h-[8.938px] items-start left-[6.78px] top-[9.28px] w-[6.438px]" data-name="Container">
      <Icon />
    </div>
  );
}

function Icon1() {
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

function Container44() {
  return (
    <div className="absolute content-stretch flex flex-col h-[17.281px] items-start left-[1.78px] top-[0.94px] w-[16.438px]" data-name="Container">
      <Icon1 />
    </div>
  );
}

function Container42() {
  return (
    <div className="absolute left-0 overflow-clip size-[20px] top-0" data-name="Container">
      <Container43 />
      <Container44 />
    </div>
  );
}

function Container41() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Container42 />
    </div>
  );
}

function Container40() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 pt-[11px] px-[11px] rounded-[21px] size-[42px] top-0" data-name="Container">
      <Container41 />
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

function Container39() {
  return (
    <div className="absolute h-[61.188px] left-[2.02px] top-0 w-[42px]" data-name="Container">
      <Container40 />
      <Paragraph />
    </div>
  );
}

function Icon2() {
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

function Container49() {
  return (
    <div className="absolute content-stretch flex flex-col h-[16.453px] items-start left-[5.94px] top-[0.94px] w-[8.125px]" data-name="Container">
      <Icon2 />
    </div>
  );
}

function Icon3() {
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

function Container50() {
  return (
    <div className="absolute content-stretch flex flex-col h-[13.109px] items-start left-[0.94px] top-[4.28px] w-[18.125px]" data-name="Container">
      <Icon3 />
    </div>
  );
}

function Container48() {
  return (
    <div className="absolute left-0 overflow-clip size-[20px] top-0" data-name="Container">
      <Container49 />
      <Container50 />
    </div>
  );
}

function Container47() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Container">
      <Container48 />
    </div>
  );
}

function Container46() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[2.02px] pt-[11px] px-[11px] rounded-[21px] size-[42px] top-0" data-name="Container">
      <Container47 />
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

function Container45() {
  return (
    <div className="absolute h-[61.188px] left-0 top-[75.19px] w-[46.063px]" data-name="Container">
      <Container46 />
      <Paragraph1 />
    </div>
  );
}

function Icon5() {
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

function Icon4() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Icon5 />
    </div>
  );
}

function Container53() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip size-[20px] top-0" data-name="Container">
      <Icon4 />
    </div>
  );
}

function Container52() {
  return (
    <div className="absolute left-[12px] size-[20px] top-[11px]" data-name="Container">
      <Container53 />
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

function Container51() {
  return (
    <div className="absolute h-[61.188px] left-[1.02px] top-[150.38px] w-[43.141px]" data-name="Container">
      <Container52 />
      <Paragraph2 />
    </div>
  );
}

function Icon7() {
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

function Icon6() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Icon7 />
    </div>
  );
}

function Container56() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip shadow-[0px_0px_16px_0px_rgba(255,255,255,0.7),0px_0px_56px_0px_rgba(255,255,255,0.45),0px_0px_120px_0px_rgba(255,255,255,0.25)] size-[20px] top-0" data-name="Container">
      <Icon6 />
    </div>
  );
}

function Container55() {
  return (
    <div className="absolute left-[12px] size-[20px] top-[11px]" data-name="Container">
      <Container56 />
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

function Container57() {
  return (
    <div className="absolute content-stretch flex flex-col h-[13.188px] items-start left-0 pl-[0.336px] pr-[-0.664px] pt-[-1px] shadow-[0px_0px_36px_0px_rgba(255,255,255,0.55),0px_0px_80px_0px_rgba(255,255,255,0.28)] top-[48px] w-[44px]" data-name="Container">
      <Paragraph3 />
    </div>
  );
}

function Container54() {
  return (
    <div className="absolute h-[61.188px] left-[1.02px] top-[225.55px] w-[44px]" data-name="Container">
      <Container55 />
      <Container57 />
    </div>
  );
}

function Container38() {
  return (
    <div className="absolute h-[361.938px] left-[19.97px] top-[90px] w-[46.063px]" data-name="Container">
      <Container39 />
      <Container45 />
      <Container51 />
      <Container54 />
    </div>
  );
}

function Container37() {
  return (
    <div className="absolute h-[655px] left-px rounded-[16px] top-px w-[84px]" data-name="Container">
      <Image />
      <Container38 />
    </div>
  );
}

function Container36() {
  return (
    <div className="h-[655px] overflow-clip relative rounded-[12px] shrink-0 w-full" data-name="Container">
      <Container37 />
    </div>
  );
}

function AppSidebar() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.04)] content-stretch flex flex-col h-[657px] items-start left-[24px] p-px rounded-[12px] top-[78px] w-[88px]" data-name="AppSidebar">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.15)] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_0px_0px_0px_rgba(0,0,0,0.1),0px_6px_20px_0px_rgba(0,0,0,0.18)]" />
      <Container36 />
    </div>
  );
}

function Icon8() {
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

function Button1() {
  return (
    <div className="h-[29.5px] relative rounded-[9px] shrink-0 w-[73.531px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon8 />
        <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[19.5px] left-[48.5px] not-italic text-[13px] text-[rgba(255,255,255,0.58)] text-center top-[5px] whitespace-nowrap">Back</p>
      </div>
    </div>
  );
}

function Container58() {
  return (
    <div className="h-[29.5px] relative shrink-0 w-[80px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Button1 />
      </div>
    </div>
  );
}

function Text14() {
  return (
    <div className="flex-[1_0_0] h-[22.5px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[22.5px] left-0 not-italic text-[#ec4899] text-[15px] top-[-2px] tracking-[-0.45px] whitespace-nowrap">tatva</p>
      </div>
    </div>
  );
}

function Text15() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-[32.313px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[22.5px] left-0 not-italic text-[15px] text-[rgba(255,255,255,0.82)] top-[-2px] tracking-[-0.45px] whitespace-nowrap">:Ops</p>
      </div>
    </div>
  );
}

function Container60() {
  return (
    <div className="flex-[1_0_0] h-[22.5px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <Text14 />
        <Text15 />
      </div>
    </div>
  );
}

function Icon9() {
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

function Container61() {
  return (
    <div className="relative rounded-[15px] shrink-0 size-[30px]" data-name="Container" style={{ backgroundImage: "linear-gradient(135deg, rgb(55, 65, 81) 0%, rgb(31, 41, 55) 100%)" }}>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.13)] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[8px] py-px relative size-full">
        <Icon9 />
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="h-[30px] relative shrink-0 w-[111.688px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[14px] items-center relative size-full">
        <Container60 />
        <Container61 />
      </div>
    </div>
  );
}

function AppHeader() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.03)] content-stretch flex h-[48px] items-center justify-between left-0 pb-px px-[40px] top-0 w-[1440px]" data-name="AppHeader">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.1)] border-b border-solid inset-0 pointer-events-none shadow-[0px_4px_18px_0px_rgba(0,0,0,0.15)]" />
      <Container58 />
      <Container59 />
    </div>
  );
}

function UploadFloorPlan() {
  return (
    <div className="absolute h-[813px] left-0 top-0 w-[1440px]" data-name="UploadFloorPlan">
      <Container />
      <AppSidebar />
      <AppHeader />
    </div>
  );
}

function App2() {
  return (
    <div className="absolute h-[813px] left-0 overflow-clip top-0 w-[1440px]" data-name="App">
      <UploadFloorPlan />
    </div>
  );
}

export default function ErasePanel() {
  return (
    <div className="bg-white relative size-full" data-name="erase panel">
      <App />
      <App1 />
      <App2 />
    </div>
  );
}
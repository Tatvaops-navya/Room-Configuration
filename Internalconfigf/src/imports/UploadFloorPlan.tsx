import svgPaths from "./svg-ulnieqdr7k";
import svgPathsFigma from "./svg-zajpvgtcjc";
import svgPathsInterior from "./svg-5r0w3ksay9";
import imgContainer from "figma:asset/cbb61108720d04d2ff8d142ee51098e6c2f1f1ef.png";
import imgImage from "figma:asset/4e65f32928ec1c24c3d2480d067ce09ec48a2ae5.png";
import imgImageRobot from "figma:asset/6854101e0adfcbe57d7b01a404b895b405fd650c.png";
import { imgVector } from "./svg-ba9mt";
import { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Building2 } from 'lucide-react';
import { RoomConfigStudio } from '../app/components/RoomConfigStudio';
import { DEFAULT_REGIONAL_STYLE_NAME } from '../app/components/regionalDesignStyles';
import { AppHeader } from '../app/components/AppHeader';
import { AppSidebar } from '../app/components/AppSidebar';
import { GenerationResults } from '../app/components/GenerationResults';
import {
  blobUrlToDataUrl,
  postRoomGenerate,
  type RoomWizardCompletePayload,
  type RoomWizardSession,
} from '../lib/roomGenerateApi';
import { applyWatermarkToImage } from '../lib/tatvaWatermark';

/** Same as `app/page.tsx` MAX_GENERATION_HISTORY */
const MAX_GENERATION_HISTORY = 20;

function Container3() {
  return (
    <div className="absolute h-[813px] left-0 top-0 w-[1440px]" data-name="Container">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgContainer} />
    </div>
  );
}

function Container3Blurred() {
  return (
    <div className="absolute h-[813px] left-0 top-0 w-[1440px]" data-name="Container">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgContainer} style={{ filter: 'blur(20px)' }} />
    </div>
  );
}

function Container4() {
  return <div className="absolute bg-black h-[813px] left-0 opacity-35 top-0 w-[1440px]" data-name="Container" />;
}

function Paragraph() {
  return (
    <div className="absolute h-[24px] left-[490px] opacity-80 top-0 w-[220px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-1/2 not-italic text-[#f4f0e6] text-[16px] text-center top-[-1px] whitespace-nowrap">Let Your Soul Find Its</p>
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute h-[102px] left-0 top-0 w-[318.813px]" data-name="Heading 1">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[102px] left-0 not-italic text-[#f4f0e6] text-[102px] top-0">Happy</p>
    </div>
  );
}

function Heading1() {
  return (
    <div className="absolute h-[102px] left-0 top-0 w-[307.922px]" data-name="Heading 1">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[102px] left-0 not-italic text-[#f4f0e6] text-[102px] top-0">Space</p>
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-[-16px] size-[18.025px] top-[-16px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.0249 18.0249">
        <g clipPath="url(#clip0_1_227)" id="Icon" opacity="0.85">
          <path d="M18 0H0V18" id="Vector" stroke="var(--stroke-0, #F4F0E6)" strokeWidth="2" />
        </g>
        <defs>
          <clipPath id="clip0_1_227">
            <rect fill="white" height="18.0249" width="18.0249" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute left-[305.9px] size-[18.025px] top-[-16px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.0249 18.0249">
        <g clipPath="url(#clip0_1_230)" id="Icon" opacity="0.85">
          <path d="M0 0H18V18" id="Vector" stroke="var(--stroke-0, #F4F0E6)" strokeWidth="2" />
        </g>
        <defs>
          <clipPath id="clip0_1_230">
            <rect fill="white" height="18.0249" width="18.0249" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Icon2() {
  return (
    <div className="absolute left-[-16px] size-[18.025px] top-[99.98px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.0249 18.0249">
        <g clipPath="url(#clip0_1_222)" id="Icon" opacity="0.85">
          <path d="M0 0V18H18" id="Vector" stroke="var(--stroke-0, #F4F0E6)" strokeWidth="2" />
        </g>
        <defs>
          <clipPath id="clip0_1_222">
            <rect fill="white" height="18.0249" width="18.0249" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Icon3() {
  return (
    <div className="absolute left-[305.9px] size-[18.025px] top-[99.98px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.0249 18.0249">
        <g clipPath="url(#clip0_1_219)" id="Icon" opacity="0.85">
          <path d="M18 0V18H0" id="Vector" stroke="var(--stroke-0, #F4F0E6)" strokeWidth="2" />
        </g>
        <defs>
          <clipPath id="clip0_1_219">
            <rect fill="white" height="18.0249" width="18.0249" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute h-[102px] left-[334.81px] top-0 w-[307.922px]" data-name="Container">
      <Heading1 />
      <div className="focus-frame-animation">
        <Icon />
        <Icon1 />
        <Icon2 />
        <Icon3 />
      </div>
      <style>{`
        @keyframes focusFramePulse {
          0% {
            opacity: 0.85;
            transform: scale(1);
            filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
            filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.20));
          }
          100% {
            opacity: 0.85;
            transform: scale(1);
            filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
          }
        }
        
        .focus-frame-animation {
          animation: focusFramePulse 2400ms ease-in-out infinite;
          transform-origin: center center;
        }
      `}</style>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute h-[102px] left-[278.63px] top-[68px] w-[642.734px]" data-name="Container">
      <Heading />
      <Container7 />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full">Creating</p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full">modern</p>
    </div>
  );
}

function Container9() {
  return (
    <div className="h-[54px] opacity-85 shrink-0 w-[180px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <Paragraph1 />
        <Paragraph2 />
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full">timeless interiors</p>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full">that blend</p>
    </div>
  );
}

function Container10() {
  return (
    <div className="h-[54px] opacity-85 shrink-0 w-[200px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <Paragraph3 />
        <Paragraph4 />
      </div>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full">comfort, beauty,</p>
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full">and purpose</p>
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[54px] opacity-85 shrink-0 w-[200px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <Paragraph5 />
        <Paragraph6 />
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-[218px] flex gap-[48px] h-[54px] items-center justify-center" data-name="Container">
      <Container9 />
      <Container10 />
      <Container11 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p17c65ff0} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p1aa35900} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p2b6cafc0} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p3fc7e680} id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[111px] opacity-80 size-[20px] top-[28px]" data-name="Container">
      <Icon4 />
    </div>
  );
}

function Heading2() {
  return (
    <div className="absolute content-stretch flex h-[18px] items-start left-[55.92px] top-[56px] w-[130.156px]" data-name="Heading 3">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] not-italic relative shrink-0 text-[14px] text-center text-white tracking-[-0.28px]">Room Configuration</p>
    </div>
  );
}

function Paragraph7() {
  return (
    <div className="absolute h-[28px] left-[22px] opacity-60 top-[78px] w-[198px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[14px] left-[99.39px] not-italic text-[11px] text-center text-white top-0 tracking-[-0.11px] w-[185px] whitespace-pre-wrap">Define room types, sizes, and layout preferences</p>
    </div>
  );
}

function Container15() {
  return <div className="absolute h-[10px] left-[121px] top-[124px] w-0" data-name="Container" />;
}

function Button({ onClick }: { onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="absolute bg-[rgba(255,255,255,0.12)] h-[40px] left-[61px] rounded-[10px] top-[132px] w-[120px] flex items-center justify-center cursor-pointer hover:bg-[rgba(255,255,255,0.18)] transition-colors duration-200" 
      data-name="Button"
    >
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[13px] not-italic text-[13px] text-center text-white">Get Started</p>
    </div>
  );
}

function RoomConfigurationCard({ onClick }: { onClick?: () => void }) {
  return (
    <div className="bg-[rgba(255,255,255,0.035)] backdrop-blur-[7px] border border-[rgba(255,255,255,0.15)] border-solid h-[200px] rounded-[14px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.1),0px_6px_20px_0px_rgba(0,0,0,0.18)] w-[244px] transition-all duration-200 ease-out cursor-pointer relative overflow-visible origin-center hover:scale-[1.04] hover:translate-y-[-2px] hover:border-[rgba(255,255,255,0.22)] hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.1),0px_14px_32px_0px_rgba(0,0,0,0.26)]" data-name="Container">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none rounded-[14px]" style={{ height: '40px' }} />
      <Container14 />
      <Heading2 />
      <Paragraph7 />
      <Container15 />
      <Button onClick={onClick} />
    </div>
  );
}

function Container13({ onClick }: { onClick?: () => void }) {
  return <RoomConfigurationCard onClick={onClick} />;
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.p3053b100} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p320a7e80} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M10 2.5V12.5" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[111px] opacity-80 size-[20px] top-[28px]" data-name="Container">
      <Icon5 />
    </div>
  );
}

function Heading3() {
  return (
    <div className="absolute content-stretch flex h-[18px] items-start left-[64.05px] top-[56px] w-[113.906px]" data-name="Heading 3">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] not-italic relative shrink-0 text-[14px] text-center text-white tracking-[-0.28px]">Upload Floor Plan</p>
    </div>
  );
}

function Paragraph8() {
  return (
    <div className="absolute content-stretch flex h-[14px] items-start left-[28.27px] opacity-60 top-[78px] w-[185.469px]" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[14px] not-italic relative shrink-0 text-[11px] text-center text-white tracking-[-0.11px]">Upload your floor plan to get started</p>
    </div>
  );
}

function Container18() {
  return <div className="absolute h-[24px] left-[121px] top-[110px] w-0" data-name="Container" />;
}

function Button1() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.12)] h-[40px] left-[61px] rounded-[10px] top-[132px] w-[120px] flex items-center justify-center" data-name="Button">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[13px] not-italic text-[13px] text-center text-white">Get Started</p>
    </div>
  );
}

function UploadFloorPlanCard() {
  return (
    <div className="bg-[rgba(255,255,255,0.035)] backdrop-blur-[7px] border border-[rgba(255,255,255,0.15)] border-solid h-[200px] rounded-[14px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.1),0px_6px_20px_0px_rgba(0,0,0,0.18)] w-[244px] transition-all duration-200 ease-out cursor-pointer relative overflow-visible origin-center hover:scale-[1.04] hover:translate-y-[-2px] hover:border-[rgba(255,255,255,0.22)] hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.1),0px_14px_32px_0px_rgba(0,0,0,0.26)]" data-name="Container">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none rounded-[14px]" style={{ height: '40px' }} />
      <Container17 />
      <Heading3 />
      <Paragraph8 />
      <Container18 />
      <Button1 />
    </div>
  );
}

function Container16() {
  return <UploadFloorPlanCard />;
}

function Container12({ onClick }: { onClick?: () => void }) {
  return (
    <div className="absolute h-[200px] left-[348px] top-[350px]" data-name="Container">
      <div className="flex items-center justify-center gap-[16px]">
        <Container13 onClick={onClick} />
        <Container16 />
      </div>
    </div>
  );
}

function Paragraph9() {
  return (
    <div className="absolute h-[21px] left-[519.53px] opacity-70 top-[630px] w-[160.922px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[80.5px] not-italic text-[#f4f0e6] text-[14px] text-center top-0 tracking-[2px]">www.tatvaops.com</p>
    </div>
  );
}

function Container5({ onClick }: { onClick?: () => void }) {
  return (
    <div className="absolute h-[651px] left-[120px] top-[59px] w-[1200px]" data-name="Container">
      <Paragraph />
      <Container6 />
      <Container8 />
      <Container12 onClick={onClick} />
      <Paragraph9 />
    </div>
  );
}

function Container2({ onClick }: { onClick?: () => void }) {
  return (
    <div className="h-[813px] relative shrink-0 w-full" data-name="Container">
      <Container3 />
      <Container4 />
      <Container5 onClick={onClick} />
    </div>
  );
}

function Paragraph10() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[231.828px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#9ca3af] text-[13px] top-0">© 2026 TatvaOps. All rights reserved.</p>
      </div>
    </div>
  );
}

function Link() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[85.281px]" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#9ca3af] text-[13px] top-0">Privacy Policy</p>
      </div>
    </div>
  );
}

function Link1() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[57px]" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#9ca3af] text-[13px] top-0">About Us</p>
      </div>
    </div>
  );
}

function Link2() {
  return (
    <div className="flex-[1_0_0] h-[19.5px] min-h-px min-w-px relative" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#9ca3af] text-[13px] top-0">{`Terms & Conditions`}</p>
      </div>
    </div>
  );
}

function Link3() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[68.953px]" data-name="Link">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#9ca3af] text-[13px] top-0">Contact Us</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[402.625px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[24px] items-center relative size-full">
        <Link />
        <Link1 />
        <Link2 />
        <Link3 />
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="bg-[#1a1a1a] h-[56px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[32px] relative size-full">
          <Paragraph10 />
          <Container20 />
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col h-[765px] items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <Container2 />
      <Container19 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex flex-col h-[765px] items-start left-0 overflow-clip top-[48px] w-[1440px]" data-name="Container">
      <Container1 />
    </div>
  );
}

function Icon6() {
  return (
    <div className="flex-[1_0_0] h-[20px] min-h-px min-w-px relative" data-name="Icon">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <div className="absolute bottom-[20.83%] left-[20.83%] right-1/2 top-[20.83%]" data-name="Vector">
          <div className="absolute inset-[-7.14%_-14.29%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.5 13.3333">
              <path d={svgPaths.p37c3e100} id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-1/2 left-[20.83%] right-[20.83%] top-1/2" data-name="Vector">
          <div className="absolute inset-[-0.83px_-7.14%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3333 1.66667">
              <path d="M12.5 0.833333H0.833333" id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Icon6 />
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[20px] top-[7.5px]" data-name="Button">
      <Container24 />
    </div>
  );
}

function Paragraph11() {
  return (
    <div className="absolute content-stretch flex h-[22px] items-start left-0 top-0 w-[40.469px]" data-name="Paragraph">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22px] not-italic relative shrink-0 text-[#ec4899] text-[18px] tracking-[-0.7995px]">tatva</p>
    </div>
  );
}

function Container28() {
  return (
    <div className="absolute h-[22px] left-0 top-0 w-[40.719px]" data-name="Container">
      <Paragraph11 />
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute h-[22px] left-0 top-0 w-[40.719px]" data-name="Container">
      <Container28 />
    </div>
  );
}

function Paragraph12() {
  return (
    <div className="absolute content-stretch flex h-[22px] items-start left-0 top-0 w-[37.109px]" data-name="Paragraph">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[22px] not-italic relative shrink-0 text-[#1f2937] text-[18px] tracking-[-0.7995px]">:Ops</p>
    </div>
  );
}

function Container30() {
  return (
    <div className="absolute h-[22px] left-0 top-0 w-[38px]" data-name="Container">
      <Paragraph12 />
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute h-[22px] left-[40.72px] top-0 w-[38px]" data-name="Container">
      <Container30 />
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute h-[22px] left-0 top-[3px] w-[78.719px]" data-name="Container">
      <Container27 />
      <Container29 />
    </div>
  );
}

function Icon7() {
  return (
    <div className="h-[5.313px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[12.5%_6.25%]" data-name="Vector">
        <div className="absolute inset-[-16.69%_-7.13%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6543 5.31446">
            <path d={svgPaths.p12f562e0} id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33009" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="absolute content-stretch flex flex-col h-[5.313px] items-start left-[2.67px] top-[9.34px] w-[10.656px]" data-name="Container">
      <Icon7 />
    </div>
  );
}

function Icon8() {
  return (
    <div className="h-[6.656px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[10%]" data-name="Vector_2">
        <div className="absolute inset-[-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.65625 6.65625">
            <path d={svgPaths.p2d928a80} id="Vector_2" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33126" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[4.67px] size-[6.656px] top-[1.34px]" data-name="Container">
      <Icon8 />
    </div>
  );
}

function Container35() {
  return (
    <div className="absolute left-0 overflow-clip size-[16px] top-0" data-name="Container">
      <Container36 />
      <Container37 />
    </div>
  );
}

function Container34() {
  return (
    <div className="h-[16px] relative shrink-0 w-full" data-name="Container">
      <Container35 />
    </div>
  );
}

function Container33() {
  return (
    <div className="absolute bg-[#e5e7eb] content-stretch flex flex-col items-start left-0 pt-[6px] px-[6px] rounded-[33554400px] size-[28px] top-0" data-name="Container">
      <Container34 />
    </div>
  );
}

function Container32() {
  return (
    <div className="h-[28px] overflow-clip relative rounded-[33554400px] shrink-0 w-full" data-name="Container">
      <Container33 />
    </div>
  );
}

function Container31() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[86.72px] rounded-[33554400px] size-[28px] top-0" data-name="Container">
      <Container32 />
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute h-[28px] left-[1275.28px] top-[3.5px] w-[114.719px]" data-name="Container">
      <Container26 />
      <Container31 />
    </div>
  );
}

function Container23() {
  return (
    <div className="absolute h-[35px] left-0 top-0 w-[1390px]" data-name="Container">
      {/* Removed Button2 - replaced with functional HeaderBackButton */}
      <Container25 />
    </div>
  );
}

function Container22() {
  return (
    <div className="absolute h-[35px] left-[24px] top-[8px] w-[1390px]" data-name="Container">
      <Container23 />
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] border-solid h-[48px] left-0 shadow-[0px_4px_18px_0px_rgba(0,0,0,0.15)] top-0 w-[1440px]" data-name="Container">
      <Container22 />
    </div>
  );
}

function HeaderBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute left-[24px] top-[12px] flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 ease-out hover:bg-[rgba(255,255,255,0.08)] group z-20"
      style={{
        filter: 'drop-shadow(0px 0px 0px rgba(255,255,255,0))',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.filter = 'drop-shadow(0px 0px 12px rgba(255,255,255,0.15))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'drop-shadow(0px 0px 0px rgba(255,255,255,0))';
      }}
    >
      {/* Back Arrow Icon */}
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 16 16" 
        fill="none" 
        className="transition-all duration-200"
      >
        <path 
          d="M10 12L6 8L10 4" 
          stroke="white" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="group-hover:stroke-[#f4f0e6] transition-colors duration-200"
        />
      </svg>
      
      {/* Back Text */}
      <span className="font-['Inter:Medium',sans-serif] font-medium text-[13px] text-white group-hover:text-[#f4f0e6] transition-colors duration-200">
        Back
      </span>
    </button>
  );
}


function Image() {
  return (
    <div className="absolute left-[13px] size-[60px] top-[16px]" data-name="Image">
      <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full mix-blend-screen" src={imgImage} />
    </div>
  );
}

function Icon10() {
  return (
    <div className="absolute contents inset-[8.34%_12.5%_12.5%_12.5%]" data-name="Icon">
      <div className="absolute bottom-[12.5%] left-[37.5%] right-[37.5%] top-1/2" data-name="Vector">
        <div className="absolute inset-[-9.72%_-14.58%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.45833 8.95833">
            <path d={svgPaths.pbd11680} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[8.34%_12.5%_12.5%_12.5%]" data-name="Vector_2">
        <div className="absolute inset-[-4.61%_-4.86%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.4583 17.2912">
            <path d={svgPaths.p2e74b980} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Icon9() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Icon10 />
    </div>
  );
}

function Container43() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[11px] size-[20px] top-[11px]" data-name="Container">
      <Icon9 />
    </div>
  );
}

function Container42() {
  return (
    <div className="absolute left-0 rounded-[21px] size-[42px] top-0" data-name="Container">
      <Container43 />
    </div>
  );
}

function Paragraph13() {
  return (
    <div className="absolute h-[13.203px] left-0 top-0 w-[31.234px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[16px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px]">Home</p>
    </div>
  );
}

function Container44() {
  return (
    <div className="absolute h-[13.188px] left-[5.31px] top-[48px] w-[31.375px]" data-name="Container">
      <Paragraph13 />
    </div>
  );
}

function Container41() {
  return (
    <div className="absolute h-[61.188px] left-[2.03px] top-0 w-[42px]" data-name="Container">
      <Container42 />
      <Container44 />
    </div>
  );
}

function Icon12() {
  return (
    <div className="absolute contents inset-[8.33%_8.33%_16.67%_8.33%]" data-name="Icon">
      <div className="absolute inset-[8.33%_33.33%_16.67%_33.33%]" data-name="Vector">
        <div className="absolute inset-[-4.86%_-10.94%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.12496 16.4584">
            <path d={svgPaths.p307fac00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[16.67%] left-[8.33%] right-[8.33%] top-1/4" data-name="Vector_2">
        <div className="absolute inset-[-6.25%_-4.37%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.125 13.125">
            <path d={svgPaths.p3799d780} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.45833" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Icon11() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Icon12 />
    </div>
  );
}

function Container47() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[11px] size-[20px] top-[11px]" data-name="Container">
      <Icon11 />
    </div>
  );
}

function Container46() {
  return (
    <div className="absolute left-[2.03px] rounded-[21px] size-[42px] top-0" data-name="Container">
      <Container47 />
    </div>
  );
}

function Paragraph14() {
  return (
    <div className="absolute h-[13.203px] left-0 top-0 w-[46.047px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[23px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px]">Services</p>
    </div>
  );
}

function Container48() {
  return (
    <div className="absolute h-[13.188px] left-0 top-[48px] w-[46.063px]" data-name="Container">
      <Paragraph14 />
    </div>
  );
}

function Container45() {
  return (
    <div className="absolute h-[61.188px] left-0 top-[75.19px] w-[46.063px]" data-name="Container">
      <Container46 />
      <Container48 />
    </div>
  );
}

function Icon13() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d="M2.5 7.5L10 2.5L17.5 7.5V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V7.5Z" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M7.5 17.5V10H12.5V17.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Container51() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[11px] size-[20px] top-[11px]" data-name="Container">
      <Icon13 />
    </div>
  );
}

function Container50() {
  return (
    <div className="absolute left-px size-[42px] top-0" data-name="Container">
      <Container51 />
    </div>
  );
}

function Paragraph15() {
  return (
    <div className="absolute h-[13.203px] left-0 top-0 w-[43.141px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[22px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px]">Projects</p>
    </div>
  );
}

function Container52() {
  return (
    <div className="absolute h-[13.188px] left-[0.47px] top-[48px] w-[43.156px]" data-name="Container">
      <Paragraph15 />
    </div>
  );
}

function Container49() {
  return (
    <div className="absolute h-[61.188px] left-[1.03px] top-[150.38px] w-[43.156px]" data-name="Container">
      <Container50 />
      <Container52 />
    </div>
  );
}

function Icon15() {
  return (
    <div className="h-[20px] overflow-clip relative shrink-0 w-full" data-name="Icon" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.70)) drop-shadow(0 0 28px rgba(255, 255, 255, 0.45)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.25))' }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPathsInterior.p7bcef60} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
          <path d="M6.66667 5L8.33333 3.33333" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
          <path d="M15 13.3333L16.6667 11.6667" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
          <path d={svgPathsInterior.p3f3ae0be} id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
          <path d={svgPathsInterior.p176d2f80} id="Vector_5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
          <path d="M12.5 4.16667L15.8333 7.5" id="Vector_6" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.21528" />
        </g>
      </svg>
    </div>
  );
}

function Container55() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[11px] size-[20px] top-[11px]" data-name="Container">
      <Icon15 />
    </div>
  );
}

function Container54() {
  return (
    <div className="absolute left-px size-[42px] top-0" data-name="Container">
      <Container55 />
    </div>
  );
}

function Paragraph16() {
  return (
    <div className="absolute h-[13.203px] left-0 top-0 w-[44.328px]" data-name="Paragraph" style={{ filter: 'drop-shadow(0 0 18px rgba(255, 255, 255, 0.55)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.28))' }}>
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[13.2px] left-[22.5px] not-italic text-[11px] text-center text-white top-[-1px] tracking-[0.0645px]">Interiors</p>
    </div>
  );
}

function Container56() {
  return (
    <div className="absolute h-[13.188px] left-0 top-[48px] w-[44px]" data-name="Container">
      <Paragraph16 />
    </div>
  );
}

function Container53() {
  return (
    <div className="absolute h-[61.188px] left-[1.03px] top-[225.56px] w-[44px]" data-name="Container">
      <Container54 />
      <Container56 />
    </div>
  );
}

function Container40() {
  return (
    <div className="absolute h-[361.938px] left-[19.97px] top-[90px] w-[46.063px]" data-name="Container">
      <Container41 />
      <Container45 />
      <Container49 />
      <Container53 />
    </div>
  );
}

function Container39() {
  return (
    <div className="h-[655px] relative rounded-[16px] shrink-0 w-full" data-name="Container">
      <Image />
      <Container40 />
    </div>
  );
}

function Container38() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.035)] backdrop-blur-[7px] border border-[rgba(255,255,255,0.15)] border-solid h-[657px] left-[24px] rounded-[12px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.1),0px_6px_20px_0px_rgba(0,0,0,0.18)] top-[78px] w-[88px]" data-name="Container">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        <Container39 />
      </div>
    </div>
  );
}

function ImageRobot() {
  return (
    <div className="relative shrink-0 size-[84px] chatbot-container" data-name="Image (Robot)">
      <img 
        alt="" 
        className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-contain pointer-events-none size-full mix-blend-screen chatbot-icon" 
        src={imgImageRobot} 
      />
      <style>{`
        @keyframes chatbotBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        .chatbot-container {
          cursor: pointer;
          transition: all 0.18s ease-out;
        }
        
        .chatbot-icon {
          animation: chatbotBreathe 1800ms ease-in-out infinite;
          transform-origin: center center;
          transition: all 0.18s ease-out;
          filter: drop-shadow(0 2px 14px rgba(0, 0, 0, 0.35));
        }
        
        .chatbot-container:hover .chatbot-icon {
          transform: scale(1.04);
          filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.45));
          animation: none;
        }
      `}</style>
    </div>
  );
}

function Button3() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-0 size-[84px] top-[70.95px]" data-name="Button">
      <ImageRobot />
    </div>
  );
}

function Container57() {
  return (
    <div className="absolute h-[160px] left-[1317px] top-[579px] w-[84px]" data-name="Container">
      <Button3 />
    </div>
  );
}

// ── Progress Stepper — horizontal circle + connector design ──────────────────
function ProgressStepper() {
  const TOTAL    = 4; // kept for reference

  const steps = [
    { label: 'Create Project', done: true  },
    { label: 'Add Media',      done: true  },
    { label: 'Configure',      done: false },
    { label: 'Launch',         done: false },
  ];

  // connector between step[i] and step[i+1] is green only when both are done
  const connectorDone = (i: number) => steps[i].done && steps[i + 1]?.done;

  return (
    <div
      className="absolute z-[5]"
      style={{ top: '96px', left: '130px', right: '26px' }}
      data-name="Progress Stepper"
    >
      {/* ── centered 1100 px column ──────────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', marginLeft: 'auto', marginRight: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* ── 1. Title ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{
            color:         'rgba(255,255,255,0.95)',
            fontFamily:    "'Inter', sans-serif",
            fontSize:      '26px',
            fontWeight:    700,
            letterSpacing: '-0.5px',
          }}>
            AI Room Configuration Studio
          </span>
          <span style={{
            marginTop:    '14px',
            marginBottom: '40px',
            color:        'rgba(255,255,255,0.48)',
            fontFamily:   "'Inter', sans-serif",
            fontSize:     '13px',
            fontWeight:   400,
            letterSpacing:'-0.1px',
            maxWidth:     '580px',
            lineHeight:   '1.65',
          }}>
            Select Internal or External configuration, upload images, then let AI detect and reconfigure with full or component-based controls.
          </span>
        </div>

        {/* ── 2. Horizontal Step Indicator ─ 820 px centered ──────────────── */}
        <div style={{ width: '820px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '36px' }}>

          {/* Soft green ambient glow under track */}
          <div style={{
            position:      'absolute',
            left:          '50%',
            transform:     'translateX(-50%)',
            width:         '820px',
            height:        '48px',
            marginTop:     '-6px',
            background:    'radial-gradient(ellipse at 38% 50%, rgba(141,227,181,0.14) 0%, transparent 70%)',
            filter:        'blur(16px)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* Circle row: left-half-line | circle | right-half-line */}
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {/* Left connector half */}
                  <div style={{
                    flex:         1,
                    height:       '2px',
                    borderRadius: '2px',
                    background:   i === 0 ? 'transparent'
                      : connectorDone(i - 1)
                        ? 'linear-gradient(90deg, rgba(47,122,85,0.60), rgba(141,227,181,0.80))'
                        : 'rgba(255,255,255,0.10)',
                  }} />

                  {/* Circle */}
                  <div style={{
                    width:                '38px',
                    height:               '38px',
                    borderRadius:         '50%',
                    flexShrink:           0,
                    display:              'flex',
                    alignItems:           'center',
                    justifyContent:       'center',
                    background:           step.done
                      ? 'linear-gradient(145deg, #1E5E3E 0%, #2F7A55 55%, #3A9468 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border:               step.done
                      ? '1.5px solid rgba(141,227,181,0.65)'
                      : '1.5px solid rgba(255,255,255,0.16)',
                    boxShadow:            step.done
                      ? '0 0 18px rgba(141,227,181,0.28), inset 0 1px 0 rgba(255,255,255,0.18)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                    backdropFilter:       'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}>
                    {step.done ? (
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M2.5 7.5L6 11L12.5 4.5" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span style={{
                        color:      'rgba(255,255,255,0.26)',
                        fontSize:   '11px',
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                      }}>{i + 1}</span>
                    )}
                  </div>

                  {/* Right connector half */}
                  <div style={{
                    flex:         1,
                    height:       '2px',
                    borderRadius: '2px',
                    background:   i === steps.length - 1 ? 'transparent'
                      : connectorDone(i)
                        ? 'linear-gradient(90deg, rgba(141,227,181,0.80), rgba(47,122,85,0.60))'
                        : 'rgba(255,255,255,0.10)',
                  }} />
                </div>

                {/* Step label */}
                <span style={{
                  marginTop:     '10px',
                  color:         step.done ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.26)',
                  fontFamily:    "'Inter', sans-serif",
                  fontSize:      '11px',
                  fontWeight:    step.done ? 500 : 400,
                  letterSpacing: '0.25px',
                  textAlign:     'center',
                  whiteSpace:    'nowrap',
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. Configuration cards ──────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>

          {/* Radial glow behind both cards */}
          <div style={{
            position:      'absolute',
            top:           '50%',
            left:          '50%',
            transform:     'translate(-50%, -50%)',
            width:         '800px',
            height:        '360px',
            background:    'radial-gradient(ellipse at center, rgba(141,227,181,0.11) 0%, rgba(100,170,255,0.07) 44%, transparent 76%)',
            pointerEvents: 'none',
            zIndex:        0,
          }} />

          {/* Cards row */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', gap: '40px' }}>
            {[
              {
                title:     'Internal Configuration',
                Icon:      LayoutDashboard,
                desc:      'Configure room layouts, partitions, and internal spatial arrangements.',
                iconSize:  55,
                titleSize: 16,
              },
              {
                title:     'External Configuration',
                Icon:      Building2,
                desc:      'Set exterior facades, building elevations, and outer structures.',
                iconSize:  48,
                titleSize: 14,
              },
            ].map(({ title, Icon, desc, iconSize, titleSize }) => (
              <div
                key={title}
                style={{
                  width:                '320px',
                  borderRadius:         '20px',
                  paddingTop:           '32px',
                  paddingBottom:        '32px',
                  paddingLeft:          '24px',
                  paddingRight:         '24px',
                  flexShrink:           0,
                  background:           'rgba(255,255,255,0.07)',
                  backdropFilter:       'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border:               '1px solid rgba(255,255,255,0.13)',
                  boxShadow:            'inset 0 1px 0 rgba(255,255,255,0.10), 0 22px 44px rgba(0,0,0,0.38)',
                  display:              'flex',
                  flexDirection:        'column',
                  alignItems:           'center',
                  justifyContent:       'space-between',
                  cursor:               'pointer',
                  transition:           'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.22)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.14), 0 28px 56px rgba(0,0,0,0.44)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.13)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.10), 0 22px 44px rgba(0,0,0,0.38)';
                }}
              >
                {/* Icon + Title + Description */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Icon size={iconSize} style={{ color: 'rgba(255,255,255,0.68)', flexShrink: 0 }} />
                  <span style={{
                    color:         'rgba(255,255,255,0.92)',
                    fontFamily:    "'Inter', sans-serif",
                    fontSize:      `${titleSize}px`,
                    fontWeight:    600,
                    letterSpacing: '-0.28px',
                    textAlign:     'center',
                    marginTop:     '2px',
                  }}>
                    {title}
                  </span>
                  <span style={{
                    color:         'rgba(255,255,255,0.50)',
                    fontFamily:    "'Inter', sans-serif",
                    fontSize:      '11px',
                    fontWeight:    400,
                    letterSpacing: '-0.1px',
                    textAlign:     'center',
                    lineHeight:    '1.55',
                    maxWidth:      '230px',
                  }}>
                    {desc}
                  </span>
                </div>

                {/* Get Started button — standardized 44 px */}
                <div
                  style={{
                    marginTop:      '20px',
                    background:     'rgba(255,255,255,0.11)',
                    borderRadius:   '10px',
                    height:         '44px',
                    width:          '140px',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    cursor:         'pointer',
                    border:         '1px solid rgba(255,255,255,0.14)',
                    transition:     'background 0.18s, border-color 0.18s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.18)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.24)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.11)';
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)';
                  }}
                >
                  <span style={{
                    color:         'rgba(255,255,255,0.92)',
                    fontFamily:    "'Inter', sans-serif",
                    fontSize:      '13px',
                    fontWeight:    500,
                    letterSpacing: '0.1px',
                  }}>
                    Get Started
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>{/* end centered content column */}
    </div>
  );
}

export default function UploadFloorPlan() {
  const [currentView,    setCurrentView]    = useState<'home' | 'roomConfig' | 'results' | 'customisation'>('home');
  const [hasActiveModal, setHasActiveModal] = useState(false);
  const [nextStepHandler, setNextStepHandler] = useState<(() => void) | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [roomSession, setRoomSession] = useState<RoomWizardSession | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  /** Same generation as `generatedImageUrl`, without client-side TatvaOps diagonal watermark (for toggle + cleaner API input). */
  const [generatedImageRawUrl, setGeneratedImageRawUrl] = useState<string | null>(null);
  /** Newest first — paired watermarked + raw API URLs per version. */
  const [historyEntries, setHistoryEntries] = useState<Array<{ watermarked: string; raw: string }>>([]);
  /** Index into `historyEntries` for Undo/Redo navigation (0 = latest). */
  const [historyCursor, setHistoryCursor] = useState(0);
  const generationHistory = useMemo(() => historyEntries.map((e) => e.watermarked), [historyEntries]);
  const generationHistoryRaw = useMemo(() => historyEntries.map((e) => e.raw), [historyEntries]);
  const [imageGenKey, setImageGenKey] = useState(0);
  const [customActiveTab, setCustomActiveTab] = useState<string | null>(null);
  const [backStepHandler, setBackStepHandler] = useState<(() => void) | null>(null);
  const [returnToPreferences, setReturnToPreferences] = useState(false);
  const [wizardServerWarning, setWizardServerWarning] = useState<string | null>(null);
  const [wizardApiPending, setWizardApiPending] = useState(false);
  /** Arrangement + empty prefs: hide scan overlay on first wizard gen; show after Regenerate (apiGenerating). */
  const [wizardSuppressInitialScan, setWizardSuppressInitialScan] = useState(false);
  const [wizardApiError, setWizardApiError] = useState<string | null>(null);
  /** Bumps when a new wizard completion starts generation; stale async completions must not apply. */
  const wizardGenTokenRef = useRef(0);
  /** When user finalizes into customisation before the first wizard generate returns, skip applying that full-room image (avoids overwriting a single-component edit). */
  const suppressWizardInitialGenResultRef = useRef(false);

  const resetToHome = useCallback(() => {
    setCurrentView('home');
    setHasActiveModal(false);
    setNextStepHandler(null);
    setBackStepHandler(null);
    setSelectedImageUrl(null);
    setRoomSession(null);
    setGeneratedImageUrl(null);
    setGeneratedImageRawUrl(null);
    setHistoryEntries([]);
    setHistoryCursor(0);
    setImageGenKey(0);
    setCustomActiveTab(null);
    setReturnToPreferences(false);
    setWizardServerWarning(null);
    setWizardApiPending(false);
    setWizardSuppressInitialScan(false);
    setWizardApiError(null);
    suppressWizardInitialGenResultRef.current = false;
    wizardGenTokenRef.current += 1;
  }, []);

  const appendGenerationHistory = useCallback((watermarked: string, raw: string) => {
    const wm = watermarked.trim();
    const r = raw.trim();
    if (!wm || !r) return;
    setHistoryEntries((prev) => {
      if (prev.some((e) => e.raw === r)) return prev;
      const rest = prev.filter((e) => e.watermarked !== wm);
      return [{ watermarked: wm, raw: r }, ...rest].slice(0, MAX_GENERATION_HISTORY);
    });
    setHistoryCursor(0);
  }, []);

  const handleGeneratedImage = useCallback((wm: string | null, raw?: string | null) => {
    setGeneratedImageUrl(wm);
    if (wm == null) {
      setGeneratedImageRawUrl(null);
      return;
    }
    if (raw != null && String(raw).trim()) {
      const normalizedRaw = String(raw).trim();
      setGeneratedImageRawUrl(normalizedRaw);
      const idx = historyEntries.findIndex((e) => e.raw === normalizedRaw);
      if (idx >= 0) setHistoryCursor(idx);
    }
  }, [historyEntries]);

  const canUndoGeneration = historyCursor < historyEntries.length - 1;
  const canRedoGeneration = historyCursor > 0;

  const applyHistoryAt = useCallback((index: number) => {
    if (index < 0 || index >= historyEntries.length) return;
    const entry = historyEntries[index];
    if (!entry) return;
    setGeneratedImageUrl(entry.watermarked);
    setGeneratedImageRawUrl(entry.raw);
    setHistoryCursor(index);
  }, [historyEntries]);

  const handleUndoGeneration = useCallback(() => {
    if (!canUndoGeneration) return;
    applyHistoryAt(historyCursor + 1);
  }, [canUndoGeneration, applyHistoryAt, historyCursor]);

  const handleRedoGeneration = useCallback(() => {
    if (!canRedoGeneration) return;
    applyHistoryAt(historyCursor - 1);
  }, [canRedoGeneration, applyHistoryAt, historyCursor]);

  return (
    <div className="relative size-full" data-name="upload floor plan">
      <AnimatePresence mode="wait">

        {/* ── HOME VIEW ─────────────────────────────────────────────────────── */}
        {currentView === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <div className="relative w-full h-full overflow-hidden">
              {/* Same interior hero as Figma / room-config studio (full-bleed + read legibility scrim) */}
              <img
                alt=""
                src={imgContainer}
                className="pointer-events-none absolute inset-0 size-full max-w-none object-cover object-center"
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.42) 50%, rgba(0,0,0,0.55) 100%)',
                }}
              />
              {/* Page content */}
              <div className="absolute left-0 top-[48px] w-[1440px] h-[765px] z-[1]">
                <div className="content-stretch flex flex-col h-[765px] items-start overflow-clip relative shrink-0 w-full">
                  <Container2 onClick={() => setCurrentView('roomConfig')} />
                  <Container19 />
                </div>
              </div>
              {/* Chatbot only — header & sidebar are provided by global shell */}
              <div className="absolute inset-0 pointer-events-none z-[10]">
                <div className="pointer-events-auto"><Container57 /></div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ROOM CONFIG STUDIO VIEW ──────────────────────────────────────── */}
        {currentView === 'roomConfig' && (
          <motion.div
            key="roomConfig"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <RoomConfigStudio 
              onModalChange={setHasActiveModal} 
              onStepNavigate={setNextStepHandler}
              onBackNavigate={setBackStepHandler}
              returnToPreferences={returnToPreferences}
              initialSession={roomSession}
              onComplete={async (payload: RoomWizardCompletePayload) => {
                suppressWizardInitialGenResultRef.current = false;
                setWizardApiError(null);
                setWizardServerWarning(null);
                const imagesDataUrl = await Promise.all(payload.blobUrls.map((u) => blobUrlToDataUrl(u)));
                const optionalReferenceImages = payload.referenceImageBlobUrls?.length
                  ? await Promise.all(payload.referenceImageBlobUrls.map((u) => blobUrlToDataUrl(u)))
                  : [];
                const layoutIndex = Math.max(0, Math.min(payload.layoutIndex, imagesDataUrl.length - 1));
                const room: RoomWizardSession = {
                  imagesDataUrl,
                  configMode: payload.configMode ?? 'purpose',
                  ...(payload.omitWizardStyleAndPalette ? { omitWizardStyleAndPalette: true } : {}),
                  ...(optionalReferenceImages.length > 0 ? { optionalReferenceImages } : {}),
                  ...(payload.configMode === 'arrangement' && optionalReferenceImages.length > 0
                    ? {
                        componentReferenceImages: optionalReferenceImages,
                        componentReferenceLabels: optionalReferenceImages.map((_, i) => `Reference component ${i + 1}`),
                      }
                    : {}),
                  ...(payload.configMode === 'arrangement' && payload.arrangementConfig
                    ? { arrangementConfig: payload.arrangementConfig }
                    : {}),
                  layoutIndex,
                  style: payload.omitWizardStyleAndPalette ? '' : payload.style || DEFAULT_REGIONAL_STYLE_NAME,
                  paletteName: payload.omitWizardStyleAndPalette ? null : payload.paletteName,
                  configType: payload.configType,
                  ...(payload.roomContext?.trim() ? { roomContext: payload.roomContext.trim() } : {}),
                  ...(payload.additionalNotes?.trim() ? { additionalNotes: payload.additionalNotes.trim() } : {}),
                };
                setRoomSession(room);
                setHistoryEntries([]);
                setHistoryCursor(0);
                setGeneratedImageUrl(null);
                setGeneratedImageRawUrl(null);
                const preview = imagesDataUrl[layoutIndex] ?? imagesDataUrl[0] ?? null;
                if (preview) setSelectedImageUrl(preview);
                setReturnToPreferences(false);
                setImageGenKey((k) => k + 1);
                setCurrentView('results');

                const arrangementEmptyPrefs =
                  payload.configMode === 'arrangement' &&
                  !(payload.referenceImageBlobUrls?.length) &&
                  !payload.additionalNotes?.trim();
                setWizardSuppressInitialScan(arrangementEmptyPrefs);

                const runId = ++wizardGenTokenRef.current;
                setWizardApiPending(true);
                setWizardApiError(null);
                void (async () => {
                  try {
                    const data = await postRoomGenerate(room, room.style, room.paletteName, {});
                    if (runId !== wizardGenTokenRef.current) return;
                    if (data.error) {
                      setWizardApiError(data.error);
                      return;
                    }
                    if (!data.imageUrl) {
                      setWizardApiError('No image returned from the server.');
                      return;
                    }
                    setWizardApiError(null);
                    setWizardServerWarning(data.warning?.trim() ?? null);
                    const wm = await applyWatermarkToImage(data.imageUrl);
                    if (runId !== wizardGenTokenRef.current) return;
                    if (!suppressWizardInitialGenResultRef.current) {
                      setGeneratedImageUrl(wm);
                      setGeneratedImageRawUrl(data.imageUrl);
                      appendGenerationHistory(wm, data.imageUrl);
                    }
                  } catch (e) {
                    if (runId !== wizardGenTokenRef.current) return;
                    setWizardApiError(e instanceof Error ? e.message : 'Generation failed.');
                  } finally {
                    if (runId === wizardGenTokenRef.current) {
                      setWizardApiPending(false);
                      setWizardSuppressInitialScan(false);
                    }
                  }
                })();
              }}
            />
          </motion.div>
        )}

        {/* ── GENERATION RESULTS VIEW ──────────────────────────────────────── */}
        {currentView === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Container3Blurred />
            <Container4 />
            <div className="absolute left-[127px] top-[78px] w-[1289px] h-[657px] z-[1]">
              <GenerationResults
                selectedImageUrl={selectedImageUrl}
                roomSession={roomSession}
                generatedImageUrl={generatedImageUrl}
                generatedImageRawUrl={generatedImageRawUrl}
                onGeneratedImage={handleGeneratedImage}
                generationHistory={generationHistory}
                generationHistoryRaw={generationHistoryRaw}
                onGenerationHistoryAppend={appendGenerationHistory}
                serverWarningOnLoad={wizardServerWarning}
                externalGeneratePending={wizardApiPending}
                externalGenerateScanSuppressed={wizardSuppressInitialScan}
                externalGenerateError={wizardApiError}
                imageGenKey={imageGenKey}
                onRegenerate={() => setImageGenKey((k) => k + 1)}
                onFinalize={() => {
                  suppressWizardInitialGenResultRef.current = true;
                  setCurrentView('customisation');
                }}
                onUndo={handleUndoGeneration}
                onRedo={handleRedoGeneration}
                canUndo={canUndoGeneration}
                canRedo={canRedoGeneration}
                onRestart={resetToHome}
              />
            </div>
          </motion.div>
        )}

        {/* ── CUSTOMISATION VIEW ──────────────────────────────────────── */}
        {currentView === 'customisation' && (
          <motion.div
            key="customisation"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Container3Blurred />
            <Container4 />
            <div className="absolute left-[127px] top-[78px] w-[1289px] h-[657px] z-[1]" style={{ overflow: 'visible' }}>
              <GenerationResults
                selectedImageUrl={selectedImageUrl}
                roomSession={roomSession}
                generatedImageUrl={generatedImageUrl}
                generatedImageRawUrl={generatedImageRawUrl}
                onGeneratedImage={handleGeneratedImage}
                generationHistory={generationHistory}
                generationHistoryRaw={generationHistoryRaw}
                onGenerationHistoryAppend={appendGenerationHistory}
                serverWarningOnLoad={wizardServerWarning}
                externalGeneratePending={false}
                externalGenerateError={null}
                imageGenKey={imageGenKey}
                onRegenerate={() => setImageGenKey((k) => k + 1)}
                isCustomisation
                customActiveTab={customActiveTab}
                onCustomTabChange={setCustomActiveTab}
                onUndo={handleUndoGeneration}
                onRedo={handleRedoGeneration}
                canUndo={canUndoGeneration}
                canRedo={canRedoGeneration}
                onRestart={resetToHome}
              />
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/*
        ── BLUR OVERLAY ──────────────────────────────────────────────────────────
        Lives here in the ROOT stacking context. Its z-index:35 is compared
        directly to AppSidebar (z:40) and AppHeader (z:50) — both always above.
        position:fixed ensures full-viewport coverage (ignores inner transforms).
      */}
      {hasActiveModal && currentView === 'roomConfig' && (
        <div
          style={{
            position:             'fixed',
            inset:                0,
            zIndex:               35,
            backdropFilter:       'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background:           'rgba(0,0,0,0.10)',
            pointerEvents:        'none',
          }}
        />
      )}

      {/* ── GLOBAL SHELL — header + sidebar, always on top, never animated ── */}
      <AppHeader
        onBack={
          currentView === 'roomConfig' && backStepHandler
            ? backStepHandler
            : currentView === 'roomConfig'
            ? () => setCurrentView('home')
            : currentView === 'results'
            ? () => {
                setReturnToPreferences(true);
                setCurrentView('roomConfig');
              }
            : currentView === 'customisation'
            ? () => setCurrentView('results')
            : undefined
        }
        onNext={nextStepHandler || undefined}
      />
      <AppSidebar />

    </div>
  );
}
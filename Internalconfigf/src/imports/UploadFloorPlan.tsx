import svgPaths from "./svg-ulnieqdr7k";
import svgPathsFigma from "./svg-zajpvgtcjc";
import svgPathsInterior from "./svg-5r0w3ksay9";
import imgContainer from "figma:asset/cbb61108720d04d2ff8d142ee51098e6c2f1f1ef.png";
import imgImage from "figma:asset/4e65f32928ec1c24c3d2480d067ce09ec48a2ae5.png";
import { imgVector } from "./svg-ba9mt";
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Building2, Menu, X, Home, Trophy, FolderKanban, Sparkles, Images, Headset, Phone, Mail, MessageCircle, ChevronRight, ChevronDown, User, Settings, Gem, CreditCard, Gift, CircleHelp, Info, LogOut, ArrowLeft, ArrowRight, Bell, MapPin, Lightbulb, Bookmark, Grid2x2, Plus, Camera, Tag, SlidersHorizontal, Trash2, Search, AtSign, Bot, BellRing, Eye, Moon, Languages, ExternalLink, HelpCircle, FileText, Shield, Funnel, Grid3x3, Upload } from 'lucide-react';
import { RoomConfigStudio } from '../app/components/RoomConfigStudio';
import { ContestScreen } from '../app/components/ContestScreen';
import { BillingScreen } from '../app/components/BillingScreen';
import { HelpCenterScreen } from '../app/components/HelpCenterScreen';
import { DEFAULT_REGIONAL_STYLE_NAME } from '../app/components/regionalDesignStyles';
import { AppHeader } from '../app/components/AppHeader';
import { AppSidebar } from '../app/components/AppSidebar';
import { GenerationResults } from '../app/components/GenerationResults';
import { blobUrlToDataUrl, type RoomWizardCompletePayload, type RoomWizardSession } from '../lib/roomGenerateApi';
import { applyWatermarkToImage } from '../lib/tatvaWatermark';
import { buildApiUrl } from '../lib/apiUrl';

/** Same as `app/page.tsx` MAX_GENERATION_HISTORY */
const MAX_GENERATION_HISTORY = 20;
const PROFILE_POSTS_STORAGE_KEY = 'tatvaops.profilePosts.v1';

/** Must match Next `app/home/page.tsx` — same persisted session shape. */
const SPACIA_TOKEN_KEY = 'spacia.token';
const SPACIA_OTP_VERIFIED_KEY = 'spacia.otpVerified';

function isSpaciaLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(window.localStorage.getItem(SPACIA_TOKEN_KEY)?.trim())
      || window.localStorage.getItem(SPACIA_OTP_VERIFIED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Called after OTP verify succeeds; stores JWT if present so we skip onboarding on restart. */
function persistSpaciaSessionAfterVerify(payload: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    const body =
      payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
    let token: string | undefined;
    const tTop = body.token;
    if (typeof tTop === 'string' && tTop.trim()) token = tTop.trim();
    if (!token && body.data !== null && typeof body.data === 'object') {
      const d = body.data as Record<string, unknown>;
      if (typeof d.token === 'string' && d.token.trim()) token = d.token.trim();
      else if (typeof (d as { accessToken?: string }).accessToken === 'string') {
        const v = String((d as { accessToken: string }).accessToken).trim();
        if (v) token = v;
      } else if (typeof (d as { jwt?: string }).jwt === 'string') {
        const v = String((d as { jwt: string }).jwt).trim();
        if (v) token = v;
      }
    }
    if (token) window.localStorage.setItem(SPACIA_TOKEN_KEY, token);
    else window.localStorage.setItem(SPACIA_OTP_VERIFIED_KEY, '1');
  } catch {
    // ignore
  }
}

function clearSpaciaSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SPACIA_TOKEN_KEY);
    window.localStorage.removeItem(SPACIA_OTP_VERIFIED_KEY);
  } catch {
    // ignore
  }
}

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
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-1/2 not-italic text-[#f4f0e6] text-[16px] text-center top-[-1px] whitespace-nowrap"></p>
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute h-[102px] left-0 top-0 w-full" data-name="Heading 1">
      <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[92px] left-1/2 not-italic text-[#f4f0e6] text-[92px] top-0 whitespace-nowrap">
        What would you like
      </p>
    </div>
  );
}

function Heading1() {
  return (
    <div className="absolute h-[102px] left-0 top-0 w-full" data-name="Heading 1">
      <p className="-translate-x-1/2 absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[92px] left-1/2 not-italic text-[#f4f0e6] text-[92px] top-0 whitespace-nowrap">
        to imagine?
      </p>
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
    <div className="absolute h-[102px] left-0 top-0 w-full" data-name="Container">
      <Heading1 />
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute h-[204px] left-0 top-[84px] w-[1200px]" data-name="Container">
      <Heading />
      <div className="absolute left-0 top-[102px] w-full h-[102px]">
        <Container7 />
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full"></p>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full"></p>
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
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full"></p>
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full"></p>
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
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full"></p>
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="h-[27px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[27px] not-italic text-white text-[19px] text-center w-full"></p>
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
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] not-italic relative shrink-0 text-[14px] text-center text-white tracking-[-0.28px]">Imagine your full house</p>
    </div>
  );
}

function Paragraph7() {
  return (
    <div className="absolute h-[28px] left-[22px] opacity-60 top-[78px] w-[198px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[14px] left-[99.39px] not-italic text-[11px] text-center text-white top-0 tracking-[-0.11px] w-[185px] whitespace-pre-wrap">Upload your floor plan (PDF or image). We won't go further from here yet.</p>
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
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] not-italic relative shrink-0 text-[14px] text-center text-white tracking-[-0.28px]">Imagine your room</p>
    </div>
  );
}

function Paragraph8() {
  return (
    <div className="absolute content-stretch flex h-[14px] items-start left-[28.27px] opacity-60 top-[78px] w-[185.469px]" data-name="Paragraph">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[14px] not-italic relative shrink-0 text-[11px] text-center text-white tracking-[-0.11px]">Next choose Internal or External, then upload room photos.</p>
    </div>
  );
}

function Container18() {
  return <div className="absolute h-[24px] left-[121px] top-[110px] w-0" data-name="Container" />;
}

function Button1({ onClick }: { onClick?: () => void }) {
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

function UploadFloorPlanCard({ onClick }: { onClick?: () => void }) {
  return (
    <div className="bg-[rgba(255,255,255,0.035)] backdrop-blur-[7px] border border-[rgba(255,255,255,0.15)] border-solid h-[200px] rounded-[14px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.1),0px_6px_20px_0px_rgba(0,0,0,0.18)] w-[244px] transition-all duration-200 ease-out cursor-pointer relative overflow-visible origin-center hover:scale-[1.04] hover:translate-y-[-2px] hover:border-[rgba(255,255,255,0.22)] hover:shadow-[0px_0px_0px_1px_rgba(0,0,0,0.1),0px_14px_32px_0px_rgba(0,0,0,0.26)]" data-name="Container">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none rounded-[14px]" style={{ height: '40px' }} />
      <Container17 />
      <Heading3 />
      <Paragraph8 />
      <Container18 />
      <Button1 onClick={onClick} />
    </div>
  );
}

function Container16({ onClick }: { onClick?: () => void }) {
  return <UploadFloorPlanCard onClick={onClick} />;
}

function Container12({ onRoomConfigClick, onUploadFloorPlanClick }: { onRoomConfigClick?: () => void; onUploadFloorPlanClick?: () => void }) {
  return (
    <div className="absolute h-[200px] left-[348px] top-[350px]" data-name="Container">
      <div className="flex items-center justify-center gap-[16px]">
        <Container13 onClick={onRoomConfigClick} />
        <Container16 onClick={onUploadFloorPlanClick} />
      </div>
    </div>
  );
}

function Paragraph9() {
  return (
    <div className="absolute h-[21px] left-[519.53px] opacity-70 top-[630px] w-[160.922px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[80.5px] not-italic text-[#f4f0e6] text-[14px] text-center top-0 tracking-[2px]"></p>
    </div>
  );
}

function Container5({ onRoomConfigClick, onUploadFloorPlanClick }: { onRoomConfigClick?: () => void; onUploadFloorPlanClick?: () => void }) {
  return (
    <div className="absolute h-[651px] left-[120px] top-[59px] w-[1200px]" data-name="Container">
      <Paragraph />
      <Container6 />
      <Container8 />
      <Container12 onRoomConfigClick={onRoomConfigClick} onUploadFloorPlanClick={onUploadFloorPlanClick} />
      <Paragraph9 />
    </div>
  );
}

function Container2({ onRoomConfigClick, onUploadFloorPlanClick }: { onRoomConfigClick?: () => void; onUploadFloorPlanClick?: () => void }) {
  return (
    <div className="h-[813px] relative shrink-0 w-full" data-name="Container">
      <Container3 />
      <Container4 />
      <Container5 onRoomConfigClick={onRoomConfigClick} onUploadFloorPlanClick={onUploadFloorPlanClick} />
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

type AppNavView =
  | 'home'
  | 'landing'
  | 'imagineStart'
  | 'login'
  | 'verify'
  | 'roomConfig'
  | 'results'
  | 'customisation'
  | 'profile'
  | 'createPost'
  | 'followers'
  | 'settings'
  | 'helpCenter'
  | 'billing'
  | 'gallery'
  | 'contest';

function getInitialNavView(): AppNavView {
  if (typeof window === 'undefined') return 'roomConfig';
  const p = window.location.pathname.toLowerCase();
  if (isSpaciaLoggedIn()) {
    if (p.startsWith('/home')) return 'home';
    // For "Imagine" start, always land on the studio first page.
    return 'roomConfig';
  }
  if (p.startsWith('/home')) return 'home';
  if (p.startsWith('/login')) return 'login';
  if (p.startsWith('/verify')) return 'verify';
  // For "Imagine" start, use the studio as the entry screen.
  return 'roomConfig';
}

export default function UploadFloorPlan() {
  const [currentView, setCurrentView] = useState<AppNavView>(() => getInitialNavView());
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
  const [isMobileHome, setIsMobileHome] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [homeHeroLoaded, setHomeHeroLoaded] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportDragY, setSupportDragY] = useState(0);
  const supportTouchStartYRef = useRef<number | null>(null);
  const [spaciaCountryCode] = useState('+91');
  const [spaciaPhoneDigits, setSpaciaPhoneDigits] = useState('');
  const [spaciaOtpDigits, setSpaciaOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const spaciaOtpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [spaciaTimer, setSpaciaTimer] = useState(30);
  const [spaciaSendLoading, setSpaciaSendLoading] = useState(false);
  const [spaciaVerifyLoading, setSpaciaVerifyLoading] = useState(false);
  const [spaciaError, setSpaciaError] = useState<string | null>(null);
  const createPostFileInputRef = useRef<HTMLInputElement | null>(null);
  const [createPostImages, setCreatePostImages] = useState<string[]>([]);
  const [createPostActiveImageIdx, setCreatePostActiveImageIdx] = useState(0);
  const [createPostCaption, setCreatePostCaption] = useState('');
  const [profilePosts, setProfilePosts] = useState<Array<{ id: string; images: string[]; caption: string }>>([]);
  const [socialTab, setSocialTab] = useState<'followers' | 'following'>('followers');
  const [socialSearch, setSocialSearch] = useState('');
  const [followingPeople, setFollowingPeople] = useState<string[]>(['Elena Vance', 'Sarah Jenkins']);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
  const [masterNotificationsEnabled, setMasterNotificationsEnabled] = useState(true);
  const [likesCommentsEnabled, setLikesCommentsEnabled] = useState(true);
  const [accountVisible, setAccountVisible] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryCategory, setGalleryCategory] = useState<'All' | 'Living Room' | 'Bedroom' | 'Kitchen' | 'Office' | 'AI Generated'>('All');
  const [galleryTab, setGalleryTab] = useState<'Explore' | 'My Gallery' | 'Saved'>('Explore');
  /** Bumps when a new wizard completion starts generation; stale async completions must not apply. */
  const wizardGenTokenRef = useRef(0);
  /** When user finalizes into customisation before the first wizard generate returns, skip applying that full-room image (avoids overwriting a single-component edit). */
  const suppressWizardInitialGenResultRef = useRef(false);

  // Full-house (floor plan) entry
  const fullHouseInputRef = useRef<HTMLInputElement | null>(null);
  const [fullHouseFloorPlanName, setFullHouseFloorPlanName] = useState<string | null>(null);
  const [fullHouseFloorPlanUrl, setFullHouseFloorPlanUrl] = useState<string | null>(null);
  const [fullHouseFloorPlanError, setFullHouseFloorPlanError] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearSpaciaSession();
    setIsMobileNavOpen(false);
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
    // After logout, route to login.
    setCurrentView('login');
    try {
      if (typeof window !== 'undefined') window.history.replaceState(null, '', '/login');
    } catch {
      // ignore
    }
  }, []);

  const resetToHome = useCallback(() => {
    // "Restart" should return to the studio entry (upload + internal/external).
    setCurrentView('roomConfig');
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

  const closeSupportModal = useCallback(() => {
    setSupportModalOpen(false);
    setSupportDragY(0);
    supportTouchStartYRef.current = null;
  }, []);

  const mobileDrawerItems = [
    { label: 'Profile / Account', Icon: User, active: currentView === 'profile', onClick: () => setCurrentView('profile') },
    { label: 'Settings', Icon: Settings, active: currentView === 'settings', onClick: () => setCurrentView('settings') },
    { label: 'Pricing / Plans', Icon: Gem },
    { label: 'Billing', Icon: CreditCard, active: currentView === 'billing', onClick: () => setCurrentView('billing') },
    { label: 'Rewards', Icon: Gift },
    { label: 'Support', Icon: CircleHelp, onClick: () => setSupportModalOpen(true) },
  ] as const;

  const handleSupportTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    supportTouchStartYRef.current = t.clientY;
  }, []);

  const handleSupportTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const startY = supportTouchStartYRef.current;
    const t = e.touches[0];
    if (startY == null || !t) return;
    const delta = Math.max(0, t.clientY - startY);
    setSupportDragY(Math.min(220, delta));
  }, []);

  const handleSupportTouchEnd = useCallback(() => {
    if (supportDragY > 90) {
      closeSupportModal();
      return;
    }
    setSupportDragY(0);
    supportTouchStartYRef.current = null;
  }, [supportDragY, closeSupportModal]);

  const handleCreatePostImagePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    void Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(new Error('Failed to read image file.'));
            reader.readAsDataURL(file);
          })
      )
    ).then((urls) => {
      const clean = urls.filter((u) => u.trim().length > 0);
      if (!clean.length) return;
      setCreatePostImages(clean);
      setCreatePostActiveImageIdx(0);
    }).catch(() => {
      // keep the current compose state untouched if file parsing fails
    });
  }, []);

  const handleCreatePostSubmit = useCallback(() => {
    if (!createPostImages.length) return;
    setProfilePosts((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        images: createPostImages,
        caption: createPostCaption.trim(),
      },
      ...prev,
    ]);
    setCreatePostCaption('');
    setCreatePostImages([]);
    setCreatePostActiveImageIdx(0);
    if (createPostFileInputRef.current) createPostFileInputRef.current.value = '';
    setCurrentView('profile');
  }, [createPostCaption, createPostImages]);

  const handleDeleteProfilePost = useCallback((postId: string) => {
    setProfilePosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const socialPeople = useMemo(
    () => ([
      { name: 'Elena Vance', role: 'Product Designer', avatar: '👩‍💼' },
      { name: 'Marcus Thorne', role: 'Creative Director', avatar: '👨‍💼' },
      { name: 'Sarah Jenkins', role: 'Tech Lead', avatar: '👩‍💻' },
      { name: 'David Chen', role: 'System Architect', avatar: '👨‍💻' },
    ]),
    []
  );

  const visibleSocialPeople = useMemo(() => {
    const pool = socialTab === 'followers'
      ? socialPeople
      : socialPeople.filter((p) => followingPeople.includes(p.name));
    const q = socialSearch.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
  }, [socialPeople, socialTab, followingPeople, socialSearch]);

  const galleryCards = useMemo(
    () => ([
      { title: 'Modern Living Room', style: 'Modern', room: 'Living Room', likes: 231, ai: true, img: 'https://images.unsplash.com/photo-1616594039964-3f5e4b8c7d55?w=800&q=80&auto=format&fit=crop' },
      { title: 'Luxury Bedroom', style: 'Luxury', room: 'Bedroom', likes: 189, ai: false, img: 'https://images.unsplash.com/photo-1616593969747-4797dc75033e?w=800&q=80&auto=format&fit=crop' },
      { title: 'Minimal Kitchen', style: 'Minimal', room: 'Kitchen', likes: 156, ai: false, img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80&auto=format&fit=crop' },
      { title: 'Modern Office', style: 'Modern', room: 'Office', likes: 142, ai: true, img: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80&auto=format&fit=crop' },
      { title: 'Elegant Dining Room', style: 'Classic', room: 'Dining Room', likes: 98, ai: false, img: 'https://images.unsplash.com/photo-1617104551722-3b2d513664c6?w=800&q=80&auto=format&fit=crop' },
      { title: 'Balcony Lounge', style: 'Modern', room: 'Outdoor', likes: 87, ai: true, img: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&q=80&auto=format&fit=crop' },
    ]),
    []
  );

  const visibleGalleryCards = useMemo(() => {
    const q = gallerySearch.trim().toLowerCase();
    return galleryCards.filter((c) => {
      const matchCategory =
        galleryCategory === 'All' ||
        (galleryCategory === 'AI Generated' ? c.ai : c.room === galleryCategory);
      const matchTab =
        galleryTab === 'Explore' ||
        (galleryTab === 'My Gallery' ? !c.ai : c.likes >= 140);
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.style.toLowerCase().includes(q) ||
        c.room.toLowerCase().includes(q);
      return matchCategory && matchTab && matchSearch;
    });
  }, [galleryCards, gallerySearch, galleryCategory, galleryTab]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobileHome(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // URL → view mapping (so /landing, /home, /login, /verify deep-links work in Vite)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = window.location.pathname.toLowerCase();
    if (isSpaciaLoggedIn()) {
      if (p.startsWith('/login') || p.startsWith('/verify')) {
        setCurrentView('home');
        try {
          window.history.replaceState(null, '', '/home');
        } catch {
          /* ignore */
        }
        return;
      }
      if (p.startsWith('/landing')) {
        setCurrentView('roomConfig');
        return;
      }
    }
    if (p.startsWith('/landing')) setCurrentView('roomConfig');
    else if (p.startsWith('/home')) setCurrentView('home');
    else if (p.startsWith('/login')) setCurrentView('login');
    else if (p.startsWith('/verify')) setCurrentView('verify');
    else if (p.startsWith('/contest')) setCurrentView('contest');
    // else: keep default
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync with core views (non-destructive; does not trigger full reload)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const desired =
      currentView === 'landing'
        ? '/landing'
        : currentView === 'home'
          ? '/home'
          : currentView === 'login'
            ? '/login'
            : currentView === 'verify'
              ? '/verify'
              : currentView === 'contest'
                ? '/contest'
                : null;
    if (!desired) return;
    try {
      if (window.location.pathname !== desired) {
        window.history.replaceState(null, '', desired);
      }
    } catch {
      // ignore history failures
    }
  }, [currentView]);

  useEffect(() => {
    if (currentView !== 'verify') return;
    setSpaciaTimer(30);
    const id = window.setInterval(() => {
      setSpaciaTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [currentView]);

  useEffect(() => {
    if (!isMobileHome) {
      setIsMobileNavOpen(false);
      setHomeHeroLoaded(false);
    }
  }, [isMobileHome]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(PROFILE_POSTS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{ id?: string; images?: string[]; caption?: string }>;
      if (!Array.isArray(parsed)) return;
      const normalized = parsed
        .map((p) => ({
          id: typeof p.id === 'string' ? p.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          images: Array.isArray(p.images) ? p.images.filter((u) => typeof u === 'string' && u.trim().length > 0) : [],
          caption: typeof p.caption === 'string' ? p.caption : '',
        }))
        .filter((p) => p.images.length > 0);
      setProfilePosts(normalized);
    } catch {
      // ignore malformed local storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PROFILE_POSTS_STORAGE_KEY, JSON.stringify(profilePosts));
    } catch {
      // ignore storage quota/private mode failures
    }
  }, [profilePosts]);

  return (
    <div className="relative w-full h-full min-h-screen md:min-h-0" data-name="upload floor plan">
      <AnimatePresence mode="wait">

        {/* ── IMAGINE ENTRY (same UI as Happy Space cards) ───────────────── */}
        {currentView === 'imagineStart' && (
          <motion.div
            key="imagineStart"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {isMobileHome ? (
              <div className="relative w-full min-h-screen overflow-hidden">
                {/* background */}
                <img
                  alt=""
                  src={imgContainer}
                  className="pointer-events-none absolute inset-0 size-full max-w-none object-cover object-center"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.52) 55%, rgba(0,0,0,0.68) 100%)',
                  }}
                />

                {/* Top bar — same hamburger pattern as Home / Gallery */}
                <div className="relative z-[2] px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
                  <div className="flex items-center justify-between">
                    <img alt="" src={imgImage} className="h-10 w-10 object-contain mix-blend-screen" loading="lazy" />
                    <p className="text-[15px] font-semibold tracking-[0.2px] text-white/95">Imagine</p>
                    <button
                      type="button"
                      onClick={() => setIsMobileNavOpen((v) => !v)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] text-white"
                      aria-label="Toggle menu"
                    >
                      {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                  </div>
                </div>

                {/* content */}
                <div className="relative z-[1] mx-auto w-full max-w-[420px] px-4 pt-6 pb-[120px]">
                  <div className="text-center text-[12px] font-semibold tracking-[0.22em] text-white/60">
                    {/* keep layout like reference; subtitle intentionally blank */}
                  </div>
                  <h1 className="mt-3 text-center text-[42px] leading-[1.05] font-extrabold tracking-[-0.04em] text-white drop-shadow-[0_12px_26px_rgba(0,0,0,0.55)]">
                    What would you like
                    <br />
                    to imagine?
                  </h1>

                  <div className="mt-8 grid gap-5">
                    <button
                      type="button"
                      onClick={() => {
                        setFullHouseFloorPlanError(null);
                        fullHouseInputRef.current?.click();
                      }}
                      className="w-full rounded-[18px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-4 py-5 text-left text-white shadow-[0_18px_44px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[12px]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)]">
                          <LayoutDashboard size={18} className="text-white/80" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[20px] font-semibold tracking-[-0.02em]">Imagine your full house</div>
                          <div className="mt-1.5 text-[12px] leading-[1.55] text-white/60">
                            Upload your floor plan (PDF or image). We won&apos;t go further from here yet.
                          </div>
                          <div className="mt-4 flex justify-center">
                            <div className="inline-flex h-[44px] w-[170px] items-center justify-center rounded-[12px] border border-white/12 bg-[rgba(255,255,255,0.10)] text-[13px] font-semibold text-white/90">
                              Get Started
                            </div>
                          </div>
                          {fullHouseFloorPlanName && (
                            <div className="mt-3 text-[12px] text-emerald-300/90">
                              Selected: {fullHouseFloorPlanName}
                            </div>
                          )}
                          {fullHouseFloorPlanError && (
                            <div className="mt-3 text-[12px] text-red-400">{fullHouseFloorPlanError}</div>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentView('roomConfig')}
                      className="w-full rounded-[18px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-4 py-5 text-left text-white shadow-[0_18px_44px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[12px]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)]">
                          <Home size={18} className="text-white/80" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[20px] font-semibold tracking-[-0.02em]">Imagine your room</div>
                          <div className="mt-1.5 text-[12px] leading-[1.55] text-white/60">
                            Next choose Internal or External, then upload room photos.
                          </div>
                          <div className="mt-4 flex justify-center">
                            <div className="inline-flex h-[44px] w-[170px] items-center justify-center rounded-[12px] border border-white/12 bg-[rgba(255,255,255,0.10)] text-[13px] font-semibold text-white/90">
                              Get Started
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 z-[1]">
                <Container2
                  onRoomConfigClick={() => {
                    // First card: full house => floor plan upload only
                    setFullHouseFloorPlanError(null);
                    fullHouseInputRef.current?.click();
                  }}
                  onUploadFloorPlanClick={() => {
                    // Second card: room => internal/external -> upload photos
                    setCurrentView('roomConfig');
                  }}
                />
              </div>
            )}

            <input
              ref={fullHouseInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                setFullHouseFloorPlanError(null);
                const ok = f.type === 'application/pdf' || f.type.startsWith('image/');
                if (!ok) {
                  setFullHouseFloorPlanError('Please upload a PDF or image file.');
                  return;
                }
                try {
                  if (fullHouseFloorPlanUrl) URL.revokeObjectURL(fullHouseFloorPlanUrl);
                } catch {
                  // ignore
                }
                setFullHouseFloorPlanName(f.name);
                setFullHouseFloorPlanUrl(URL.createObjectURL(f));
              }}
            />
          </motion.div>
        )}

        {/* ── LANDING VIEW (was "home" cards) ─────────────────────────────── */}
        {currentView === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {isMobileHome ? (
              <div className="relative w-full min-h-screen overflow-hidden bg-[#141313]">
                <div className="absolute inset-0">
                  <img
                    alt=""
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0tdM-564nn0QpuYJ_LT_yv4l2ozkuU6n7ellKnp9KeEwT27fCkhpaHA5grS2ozdSO_vY6xSFP0H25RZoGkuomjDOwQbcvnUetdorL6zsSlNPGlDzYUNrleDFx5UeJSXNvvUdufWIdAJTLIchNX_v2zcZwxIpIVIUwHDt-yV9pYX_exXH39GYQNLo3BlBTzpvLBEmPkH7c74oNkVRFVcBLvaWXlmJ8mTbnhZMmZIebqkg0sGNFovFRoyUmXSy_QQ3Kabo3j0fclcuQ"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                  <div className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(18,12,10,0.18) 0%, rgba(18,12,10,0.42) 45%, rgba(18,12,10,0.82) 100%)',
                      mixBlendMode: 'multiply',
                    }}
                  />
                  <div className="absolute inset-0 bg-[rgba(20,19,19,0.32)] backdrop-blur-[2px]" />
                </div>

                <div className="relative z-10 flex min-h-screen flex-col px-5 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[22px] font-bold tracking-[-0.2px] text-white/90">Vision</div>
                    <button
                      type="button"
                      onClick={() => setIsMobileNavOpen((v) => !v)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] text-white"
                      aria-label="Toggle menu"
                    >
                      {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                  </div>

                  <div className="mt-auto w-full max-w-[420px]">
                    <div className="text-[12px] font-bold tracking-[0.22em] text-amber-400 uppercase">
                      DESIGN YOUR WORLD
                    </div>
                    <div className="mt-3 text-[52px] leading-[1.04] tracking-[-0.02em] font-extrabold text-white drop-shadow-[0_10px_26px_rgba(0,0,0,0.45)]">
                      Find Your
                      <br />
                      <span className="text-amber-400">Perfect</span> Space
                    </div>
                    <div className="mt-4 text-[18px] leading-[1.55] text-white/70 max-w-[30ch]">
                      Join 2M+ homeowners discovering their dream spaces with elite architectural curation.
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex -space-x-3">
                        {[
                          "https://lh3.googleusercontent.com/aida-public/AB6AXuCASiK4CkTTkabpRWb-dQKsKK7yLUJjDvsMVs6slv3UzjqL12rqwpUqghWDOiK_pfzi_3n_Xhc9MuHGYYjQ7298twnwixCP95RPb-_n6llF3SVtUsnJMOAg_zvjQO3DN8RmNySiCH6AIlFcoRY_xziof_AS-OI_6RnNzt2i8cI3_57eyAbYETPXV4lBdKBL2KnOFjVQl37wqaKhcPe2jMtXb9Kp7-8VKMEjA7GEqPqDHRQW_cCgn29nCdTpfnpMpEGuMg_qSG6dN5T1",
                          "https://lh3.googleusercontent.com/aida-public/AB6AXuDler6BU1qtpvdyjxAihP26J8qzI9pXleIxggigH2z5qPmtjh-7tUodLkCGu2CSIGUT5N-VXFqQ2EzID8JaHHHt5p9lLfhLFBCH9eAJ8agNce8sh7P6iUlXmm_Jb85GqsNSFkILQltvyqkC0FVJBZQQyFHiONzJ08ArojwsLIsuLAy6wSx9IOV5B4yk3mxrwbVTHtXqmMF0uY-tNBOrOsmQORf4puaNq6pbpzzDWNgv_4E5XoSaYJEfsqTwmOrnOb_zCDXzGjb_XQNY",
                          "https://lh3.googleusercontent.com/aida-public/AB6AXuDF0DykZ5uirvDJVe7K7XmHm9C7B379g4xGbBLoAuL2OPowb5Q11CmQ3MMK5blNs1bev0uFL7qr-hfIyWPG4oln_MMJYjdV7rMMS6eRtiblnvkxCyqCf_TRJQLYiYLZCD4mL2KXW9DRqSMr6iKp-gdQWABu2esn7UB7sUymjONuxmDGN_ASCjPDflNynUtiuYtXAuGBvpqxNsElMR_MNH2gcjRJeBtqjMD0H37q8J40EyYYgLB5Aquh8vAzNYqQ1PL3IWtKaNEHEY3A",
                        ].map((src) => (
                          <img key={src} alt="" src={src} className="w-9 h-9 rounded-full border-2 border-[#141313] object-cover shadow-[0_8px_18px_rgba(0,0,0,0.35)]" />
                        ))}
                      </div>
                      <div className="text-[12px] font-bold tracking-[0.06em] text-white/80 px-3 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-[16px]">
                        +2M Users
                      </div>
                    </div>
                  </div>

                  <div className="fixed left-0 right-0 bottom-0 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 bg-gradient-to-b from-transparent via-[#141313]/50 to-[#141313]/90 backdrop-blur-[10px]">
                    <div className="max-w-[420px] mx-auto grid grid-cols-3 items-center">
                      <button
                        type="button"
                        onClick={() => setCurrentView('login')}
                        className="justify-self-start text-[16px] font-semibold text-white/70 hover:text-white transition-colors"
                      >
                        Skip
                      </button>
                      <div className="justify-self-center flex items-center gap-2">
                        <div className="w-7 h-1 rounded-full bg-amber-400" />
                        <div className="w-2 h-1 rounded-full bg-white/20" />
                        <div className="w-2 h-1 rounded-full bg-white/20" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentView('login')}
                        className="justify-self-end w-16 h-16 rounded-full bg-amber-400 text-black shadow-[0_0_26px_rgba(232,135,58,0.35)] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
                        aria-label="Continue"
                      >
                        <ArrowRight size={22} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
            </div>
            )}
          </motion.div>
        )}

        {/* ── HOME VIEW (blank placeholder for now) ───────────────────────── */}
        {currentView === 'home' && (
          <motion.div
            key="home-blank"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 bg-[#1A1510] text-[#F5F0E8]"
          >
            <div className="relative min-h-screen">
              {/* Top bar (match Imagine: logo + hamburger) */}
              <div className="sticky top-0 z-50 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 backdrop-blur-[12px] bg-[#1A1510]/90 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <img alt="" src={imgImage} className="h-10 w-10 object-contain mix-blend-screen" loading="lazy" />
                  <p className="text-[15px] font-semibold tracking-[0.2px] text-[#f4f0e6]">For You</p>
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen((v) => !v)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] text-white"
                    aria-label="Toggle menu"
                  >
                    {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                </div>
              </div>

              <main className="px-4 pb-28 pt-4">
                {/* Scrollable Tabs */}
                <nav className="hide-scrollbar flex gap-3 overflow-x-auto pb-6">
                  {[
                    { label: 'For You', active: true },
                    { label: 'Modernist', active: false },
                    { label: 'Minimalist', active: false },
                    { label: 'Japandi', active: false },
                    { label: 'Industrial', active: false },
                  ].map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      className={
                        t.active
                          ? 'flex-shrink-0 rounded-full border border-[#E8873A]/20 bg-[#E8873A]/10 px-5 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#E8873A]'
                          : 'flex-shrink-0 rounded-full border border-white/5 px-5 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#5A5248] transition-colors hover:text-[#E8873A]'
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </nav>

                {/* Masonry-like two-column grid */}
                <div className="grid grid-cols-2 items-start gap-4">
                  {/* Left Column */}
                  <div className="flex flex-col gap-4">
                    <div className="glass-card relative aspect-[3/5] overflow-hidden rounded-[18px] border border-white/10 bg-[#252018]">
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsrvdipvORdCJnUqBClI6sItrDAYQlPepHI4aUa5ttrNgtS8PTS2QkIrxe-JuO8XzPnDxpb40g7-EAfxponlV-27PNLnMwH39uEzbXQfwQFoefkbhGkYW5z3x70DiaHGoVt2tY_wT73PghZJVZGk2b_MkSJ-iR8u_Er3Dc8n2sQuO8dnfUZuGKbUWbsB-8ylmdAZBjUqqORzpNRFM_YmUYT5BqiQk4tV_oDhW6iNCzRlzrYRIHQfnw1CAO2CcdBf6Zr3e4FWfUFnnq"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A1510]/90 to-transparent" />
                    </div>

                    <div className="glass-card overflow-hidden rounded-[18px] border border-white/10 bg-[#252018]">
                      <div className="relative h-48">
                        <img
                          alt=""
                          className="h-full w-full object-cover"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC887MVMO9v5h2WWZNFqUgRFmgCgXtMFuCwXHkiQlAW0JE3e1DZfcipzRgFl7NueRGqZuceRT0MKFVGmRG4MV9wT7kozukRyqHwsk859oddaJ0VaUGWoq4P5k7DCPzMCQcjXZkuQETRuwhejrUE6hjIWujajlfpx0TgUkTo2TMdVrxxajMNtlKKF1jTQeunRZQ84yxlAtG3tkiqSYdfF34w7HzpCooloJpwH5dmNedhzbEyMN0LWe73WxLvCeBZM5HruidFZH2PWShj"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A1510]/90 to-transparent" />
                      </div>
                      <div className="p-4">
                        <div className="text-[14px] font-semibold text-[#F1DFD6]">
                          Warm Japandi Living...
                        </div>
                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#A38C7F]">
                          Interior Design
                        </div>
                      </div>
                    </div>

                    <div className="glass-card overflow-hidden rounded-[18px] border border-white/10 bg-[#252018]">
                      <div className="relative aspect-square">
                        <img
                          alt=""
                          className="h-full w-full object-cover"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoENoDSDGStCSPpcYVfiG23kEcMCSbK7Diz025_ypEVntZV6XA3IBhCLD8X0Gurax7rb7w4ondbGfEaEkb_O_9NuwWOc4Bxp03jC8EnvFf4umME7X-m2OaNQktAMYwISLlQL3i3LEs4klERicBzvkkRTBeHylIkdmWiAiIf7mFXHk-2JT5k-MFZkughKRMw3Duwh4V0ymlC8WngSyJebeedgjvrySmLmCqthr0X7xs8V7bu95KMFDDTll1hwTAsu3G8Mdty_M0Y1wM"
                        />
                        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded bg-[#E8873A] px-2 py-1 text-[10px] font-bold text-black">
                          <Sparkles size={12} />
                          AI
                        </div>
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A1510]/90 to-transparent" />
                      </div>
                      <div className="p-4">
                        <div className="text-[14px] font-semibold text-[#F1DFD6]">Boho Study Nook Idea</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-4">
                    <div className="glass-card relative -mt-8 h-36 overflow-hidden rounded-[18px] border border-white/10 bg-[#252018]">
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuARkFZsMo1c1xTw3KdmMdQyFfntkpjK3Na3WKiTAjwyCR3gYwDjBcmzfR2eIfOuBmmrmd4ofDLHJ3e0PaM6wvqKopfj_pWmOp3OpC6LKk9mkmI2qqjY_CklzJBcGr7iWngJPOJEzFNizMYwUjMmTmSkFDfV4aaHrRyN5Hx39ylCDwpZi_c5jo4NrQfS1bX5zu7J-GkH2fyMjVmzsXUk_lS1041Tts_gc2IzZyWWp1iF93tEQ_nvKyDeGH1UKf-JgVog0I_Eb0undpNB"
                      />
                      <div className="absolute right-3 top-10 rounded-full bg-[#E8873A] px-2 py-1 text-[10px] font-bold text-black">
                        ₹3,200
                      </div>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A1510]/90 to-transparent" />
                    </div>

                    <div className="glass-card overflow-hidden rounded-[18px] border border-white/10 bg-[#252018]">
                      <div className="relative aspect-[3/4]">
                        <img
                          alt=""
                          className="h-full w-full object-cover"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAcZFuFc3VKh2wNCnhiBboNbRUHjhSVUGfuFHM57SR_Xd0spnSic-JtVTKSbJtSJxRY714VfzlV5_QMoAwUjbz1rr32edAItL_S-nrX4sc-_6yOnREro2javrSbydhuNg26Y3Pbh5ETHMqFh4KggXPRrfpVO318FDtercBlRUaYP-s2eaSnSx45saNhM18DjmQ4y6xvNXQO21fSxcfYYioDUoPTRK4E629ztgKxCw8lLhlQJB2EWZhJ2ksCCi9quRntkUiZeOwmWHF"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A1510]/90 to-transparent" />
                      </div>
                      <div className="p-4">
                        <div className="text-[14px] font-semibold text-[#F1DFD6]">Midnight Velvet Suite</div>
                      </div>
                    </div>

                    <div className="glass-card relative aspect-[9/16] overflow-hidden rounded-[18px] border border-white/10 bg-[#252018]">
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgT3OX2HcUitQzAE0_j0AmVOy0ES3Aa1qCEgyvMUSyPqPth06mFhRbhbE3jJTr-gqbU_lTGePgd0lW3qL2dXETzOQlwwS4wBYX79Onq8fSW4EbN2cxWLAb1mRiJMj_Y4dajxeHiyTjIysB6iXXgLKuG0IffebkOkZJ5sykfKNP1xhbjPBewR596YYtUXIF_RC89bnZOLrGUfjdXj3aoekaJ17sH32Bwgw6XFSE7eBZrSyItKUUpO-merWvGkIhops8j6W1sWCi6Zta"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md">
                          <div className="ml-0.5 h-0 w-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-white/90" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur-md">
                        1:12
                      </div>
                    </div>

                    <div className="glass-card overflow-hidden rounded-[18px] border border-white/10 bg-[#252018]">
                      <div className="relative h-40">
                        <img
                          alt=""
                          className="h-full w-full object-cover"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7bZKkiDuspbwB0HiqLrZlsDYJlPFDD0tloGthVoArK_lLCWLf3DrABv19JYq0NDJVxcCZscyVkau7z3k9N9DK_e4ZQ2Dyagzq6wZMGBIAWhhOQCFeL7x7-VeEQujg_0X4X5tJ9dw9a7fS6f-Rq9zKOG0J-Kt8QQoc86q_T5D9_-cDfPTQyG62QbcgubYn6jT8k8LZ2upwGi1hw2Oke2ZGF4S0PpL_Ws_bCL7cmvus2rZnAywvufyv1DHYz_FUUi4hINd1coBoqDTh"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A1510]/90 to-transparent" />
                      </div>
                      <div className="p-4">
                        <div className="text-[14px] font-semibold text-[#F1DFD6]">Geometric Trio Set</div>
                      </div>
                    </div>
                  </div>
                </div>
              </main>

              <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
            </div>
          </motion.div>
        )}

        {/* ── PROFILE VIEW (mobile) ─────────────────────────────────────────── */}
        {currentView === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 bg-[#141313]"
          >
            <div className="h-full w-full overflow-y-auto pb-28">
              <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-[rgba(255,255,255,0.1)] bg-[rgba(10,10,10,0.9)] px-4 backdrop-blur-[10px]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView(isSpaciaLoggedIn() ? 'home' : 'landing')}
                    className="rounded-full p-1.5 text-white/90 transition-colors duration-200 hover:bg-white/10"
                    aria-label="Back to home"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h1 className="text-[22px] font-semibold tracking-[-0.2px] text-white">Profile</h1>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className="rounded-full p-1.5 text-white/85 transition-colors duration-200 hover:bg-white/10" aria-label="Notifications">
                    <Bell size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen((v) => !v)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] text-white"
                    aria-label="Toggle menu"
                  >
                    {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                </div>
              </header>

              <main className="mx-auto w-full max-w-[430px] px-4 pt-6">
                <section className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-[92px] w-[92px] items-center justify-center rounded-full border-2 border-[rgba(255,255,255,0.2)] bg-[linear-gradient(145deg,#2f2f32,#1a1a1d)] shadow-[0_0_24px_rgba(255,255,255,0.14)]">
                    <User size={38} className="text-white/85" />
                  </div>
                  <h2 className="text-[23px] leading-[1.1] font-semibold tracking-[-0.3px] text-white">Madhunala Navya</h2>
                  <div className="mt-2 inline-flex items-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] px-3 py-1">
                    <span className="text-[9px] font-bold tracking-[1.6px] text-white/90 uppercase">Premium Member</span>
                  </div>
                  <p className="mt-3 text-[13px] text-white/80">Interior Designer | Modern Spaces</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/62">
                    <MapPin size={14} />
                    Bangalore
                  </p>
                </section>

                <section className="mt-7 flex justify-around border-y border-[rgba(255,255,255,0.08)] py-5">
                  <button type="button" className="text-center">
                    <div className="text-[17px] font-semibold text-white">{String(profilePosts.length)}</div>
                    <div className="text-[11px] text-white/65">Posts</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSocialTab('followers');
                      setCurrentView('followers');
                    }}
                    className="text-center"
                  >
                    <div className="text-[17px] font-semibold text-white">{String(socialPeople.length)}</div>
                    <div className="text-[11px] text-white/65">Followers</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSocialTab('following');
                      setCurrentView('followers');
                    }}
                    className="text-center"
                  >
                    <div className="text-[17px] font-semibold text-white">{String(followingPeople.length)}</div>
                    <div className="text-[11px] text-white/65">Following</div>
                  </button>
                </section>

                <section className="mt-6 space-y-3">
                  <button type="button" className="h-[50px] w-full rounded-2xl bg-white text-[12px] font-semibold text-[#141313] transition-transform duration-150 active:scale-[0.98]">
                    Edit Profile
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className="flex h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-white transition-transform duration-150 active:scale-[0.98]">
                      <Lightbulb size={18} />
                      <span className="text-[11px]">Ideas & Likes</span>
                    </button>
                    <button type="button" className="flex h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-white transition-transform duration-150 active:scale-[0.98]">
                      <Bookmark size={18} />
                      <span className="text-[11px]">Saved Items</span>
                    </button>
                  </div>
                </section>

                <section className="mt-8 pb-4">
                  <div className="mb-6 flex items-end justify-between border-b border-[rgba(255,255,255,0.08)]">
                    <button type="button" className="border-b-2 border-white px-6 py-3 text-[11px] font-medium text-white">
                      Posts
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentView('createPost')}
                      className="mb-2 inline-flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-[10px] font-semibold text-white/90"
                    >
                      <Plus size={12} />
                      Create
                    </button>
                  </div>
                  {profilePosts.length === 0 ? (
                    <div className="rounded-[26px] border border-dashed border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.04)] px-5 py-12 text-center">
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)]">
                        <Grid2x2 size={25} className="text-white/35" />
                      </div>
                      <h3 className="text-[16px] font-semibold text-white">No posts yet</h3>
                      <p className="mt-1 text-[12px] text-white/62">Start sharing your designs and ideas</p>
                      <button
                        type="button"
                        onClick={() => setCurrentView('createPost')}
                        className="mx-auto mt-6 flex h-12 items-center gap-2 rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.09)] px-6 text-[12px] font-medium text-white transition-colors duration-200 hover:bg-[rgba(255,255,255,0.14)]"
                      >
                        <Plus size={18} />
                        Create Post
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {profilePosts.map((post) => (
                        <div key={post.id} className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)]">
                          <button
                            type="button"
                            onClick={() => handleDeleteProfilePost(post.id)}
                            aria-label="Delete post"
                            className="absolute right-2 top-2 z-[2] flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(0,0,0,0.55)] text-white/90"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="aspect-[4/5] w-full bg-[rgba(255,255,255,0.03)]">
                            <img src={post.images[0]} alt="Posted design" className="h-full w-full object-cover" />
                            {post.images.length > 1 ? (
                              <div className="absolute bottom-2 left-2 rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(0,0,0,0.52)] px-2 py-1 text-[10px] font-semibold text-white">
                                +{post.images.length - 1}
                              </div>
                            ) : null}
                          </div>
                          {post.caption ? (
                            <p className="line-clamp-2 px-3 py-2 text-[11px] text-white/70">{post.caption}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </main>
            </div>
          </motion.div>
        )}

        {/* ── CREATE POST VIEW (mobile) ─────────────────────────────────────── */}
        {currentView === 'createPost' && (
          <motion.div
            key="createPost"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 bg-[#141313]"
          >
            <input
              ref={createPostFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleCreatePostImagePick}
            />
            <div className="h-full w-full overflow-y-auto pb-28">
              <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-[rgba(255,255,255,0.1)] bg-[rgba(10,10,10,0.9)] px-4 backdrop-blur-[10px]">
                <button
                  type="button"
                  onClick={() => setCurrentView('profile')}
                  className="text-[12px] font-medium tracking-[0.12em] text-white/68 uppercase transition-colors duration-200 hover:text-white"
                >
                  Cancel
                </button>
                <h1 className="text-[19px] font-semibold tracking-[-0.2px] text-white">New Post</h1>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] text-white"
                    aria-label="Toggle menu"
                  >
                    {isMobileNavOpen ? <X size={17} /> : <Menu size={17} />}
                  </button>
                  <button
                    type="button"
                    disabled={!createPostImages.length}
                    onClick={handleCreatePostSubmit}
                    className={`text-[14px] font-semibold transition-colors duration-200 ${
                      createPostImages.length ? 'text-white' : 'cursor-not-allowed text-white/35'
                    }`}
                  >
                    Post
                  </button>
                </div>
              </header>

              <main className="mx-auto w-full max-w-[430px] space-y-4 px-4 pt-4">
                <button
                  type="button"
                  onClick={() => createPostFileInputRef.current?.click()}
                  className="group relative flex aspect-[4/5] w-full flex-col items-center justify-center overflow-hidden rounded-[20px] border-2 border-dashed border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.05)]"
                >
                  {createPostImages.length ? (
                    <img
                      src={createPostImages[Math.max(0, Math.min(createPostActiveImageIdx, createPostImages.length - 1))]}
                      alt="Selected post"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                  <div
                    className={`relative z-[1] flex flex-col items-center transition-opacity duration-200 ${
                      createPostImages.length ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                    }`}
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)]">
                      <Camera size={29} className="text-white" />
                    </div>
                    <p className="text-[18px] font-medium text-white">Tap to upload image</p>
                    <p className="mt-1 text-[11px] text-white/65">High-quality 4:5 recommended</p>
                  </div>
                </button>
                {createPostImages.length > 1 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {createPostImages.map((img, idx) => (
                      <button
                        key={`${img}-${idx}`}
                        type="button"
                        onClick={() => setCreatePostActiveImageIdx(idx)}
                        className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border ${
                          idx === createPostActiveImageIdx
                            ? 'border-white/70'
                            : 'border-[rgba(255,255,255,0.18)]'
                        }`}
                      >
                        <img src={img} alt={`Selected ${idx + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}

                <section className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-4">
                  <textarea
                    value={createPostCaption}
                    onChange={(e) => setCreatePostCaption(e.target.value)}
                    placeholder="Write something about your design..."
                    className="h-28 w-full resize-none bg-transparent text-[14px] text-white placeholder:text-white/30 focus:outline-none"
                  />
                </section>

                <section className="space-y-4">
                  <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Tag size={16} className="text-white/65" />
                      <span className="text-[11px] font-semibold tracking-[0.08em] text-white/65 uppercase">Trending Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['#Interior', '#Modern', '#Minimalism'].map((tag) => (
                        <button key={tag} type="button" className="rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-[12px] text-white">
                          {tag}
                        </button>
                      ))}
                      <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] text-white">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <button type="button" className="flex w-full items-center justify-between rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)]">
                        <MapPin size={17} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-white">Add location</p>
                        <p className="text-[11px] text-white/62">Help others find your inspiration</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-white/45" />
                  </button>

                  <button type="button" className="flex w-full items-center justify-between rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)]">
                        <SlidersHorizontal size={17} className="text-white" />
                      </div>
                      <p className="text-[15px] font-semibold text-white">Advanced Settings</p>
                    </div>
                    <ChevronRight size={16} className="text-white/45" />
                  </button>
                </section>
              </main>
            </div>
          </motion.div>
        )}

        {/* ── FOLLOWERS/FOLLOWING VIEW (mobile) ─────────────────────────────── */}
        {currentView === 'followers' && (
          <motion.div
            key="followers"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 bg-[#141313]"
          >
            <div className="h-full w-full overflow-y-auto pb-28">
              <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-[rgba(255,255,255,0.1)] bg-[rgba(10,10,10,0.9)] px-4 backdrop-blur-[10px]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('profile')}
                    className="rounded-full p-1.5 text-white/90 transition-colors duration-200 hover:bg-white/10"
                    aria-label="Back to profile"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h1 className="text-[22px] font-semibold tracking-[-0.2px] text-white">Followers</h1>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] text-white"
                  aria-label="Toggle menu"
                >
                  {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              </header>

              <main className="mx-auto w-full max-w-[430px] px-4 pt-6">
                <div className="mb-4 flex border-b border-[rgba(255,255,255,0.08)]">
                  <button
                    type="button"
                    onClick={() => setSocialTab('followers')}
                    className={`flex-1 border-b-2 py-3 text-[14px] font-medium ${
                      socialTab === 'followers'
                        ? 'border-white text-white'
                        : 'border-transparent text-white/45'
                    }`}
                  >
                    Followers
                  </button>
                  <button
                    type="button"
                    onClick={() => setSocialTab('following')}
                    className={`flex-1 border-b-2 py-3 text-[14px] font-medium ${
                      socialTab === 'following'
                        ? 'border-white text-white'
                        : 'border-transparent text-white/45'
                    }`}
                  >
                    Following
                  </button>
                </div>

                <div className="mb-6 flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-4 py-3">
                  <Search size={16} className="text-white/40" />
                  <input
                    value={socialSearch}
                    onChange={(e) => setSocialSearch(e.target.value)}
                    placeholder={socialTab === 'followers' ? 'Search followers' : 'Search following'}
                    className="w-full bg-transparent text-[14px] text-white placeholder:text-white/25 focus:outline-none"
                  />
                </div>

                <div className="space-y-4">
                  {visibleSocialPeople.map((person) => {
                    const isFollowing = followingPeople.includes(person.name);
                    return (
                      <div
                        key={person.name}
                        className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-4 py-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] text-[24px]">
                            {person.avatar}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-[14px] font-medium text-white">{person.name}</h3>
                            <p className="truncate text-[10px] tracking-[0.08em] text-white/45 uppercase">{person.role}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFollowingPeople((prev) =>
                              prev.includes(person.name) ? prev.filter((n) => n !== person.name) : [...prev, person.name]
                            );
                          }}
                          className={`ml-3 rounded-lg border px-5 py-2 text-[12px] font-medium ${
                            isFollowing
                              ? 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.1)] text-white'
                              : 'border-[rgba(255,255,255,0.16)] bg-white text-[#1a1a1a]'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    );
                  })}
                  {visibleSocialPeople.length === 0 && (
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-10 text-center">
                      <h3 className="text-[15px] font-semibold text-white">No {socialTab} found</h3>
                      <p className="mt-1 text-[12px] text-white/55">Try searching with a different name.</p>
                    </div>
                  )}
                </div>
              </main>
            </div>
          </motion.div>
        )}

        {/* ── SETTINGS VIEW (mobile) ────────────────────────────────────────── */}
        {currentView === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 bg-[#0e0e0e]"
          >
            <div className="h-full w-full overflow-y-auto pb-28">
              <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-[rgba(255,255,255,0.1)] bg-[rgba(10,10,10,0.9)] px-4 backdrop-blur-[10px]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView(isSpaciaLoggedIn() ? 'home' : 'landing')}
                    className="rounded-full p-1.5 text-white/90 transition-colors duration-200 hover:bg-white/10"
                    aria-label="Back to home"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h1 className="text-[18px] font-semibold tracking-[-0.2px] text-white">Settings</h1>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] text-white"
                  aria-label="Toggle menu"
                >
                  {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              </header>

              <main className="mx-auto w-full max-w-[430px] space-y-4 px-4 py-4">
                <section className="space-y-2">
                  <h2 className="px-1 text-[10px] font-semibold tracking-[0.08em] text-white/55 uppercase">Account</h2>
                  <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)]">
                    <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.1)]"><User size={16} className="text-white" /></div>
                        <div>
                          <p className="text-[14px] text-white">Edit Profile</p>
                          <p className="text-[11px] text-white/45">Madhunala Navya</p>
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-white/35" />
                    </button>
                    <button type="button" className="flex w-full items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-4 py-3 text-left hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.1)]"><AtSign size={16} className="text-white" /></div>
                        <div>
                          <p className="text-[14px] text-white">Username</p>
                          <p className="text-[11px] text-white/45">@madhunala_design</p>
                        </div>
                      </div>
                      <span className="text-[12px] text-white/35">Edit</span>
                    </button>
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="px-1 text-[10px] font-semibold tracking-[0.08em] text-white/55 uppercase">AI Preferences</h2>
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.1)]"><Bot size={16} className="text-white" /></div>
                        <div>
                          <p className="text-[14px] text-white">AI Suggestions</p>
                          <p className="text-[11px] text-white/45">Personalized smart prompts</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAiSuggestionsEnabled((v) => !v)}
                        className={`inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border p-[2px] transition-colors ${aiSuggestionsEnabled ? 'border-emerald-300/40 bg-emerald-500/70' : 'border-[rgba(255,255,255,0.18)] bg-white/10'}`}
                      >
                        <span className={`h-5 w-5 rounded-full bg-white transition-transform ${aiSuggestionsEnabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="px-1 text-[10px] font-semibold tracking-[0.08em] text-white/55 uppercase">Notifications</h2>
                  <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.1)]"><BellRing size={16} className="text-white" /></div>
                        <p className="text-[14px] text-white">Master Notifications</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMasterNotificationsEnabled((v) => !v)}
                        className={`inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border p-[2px] transition-colors ${masterNotificationsEnabled ? 'border-emerald-300/40 bg-emerald-500/70' : 'border-[rgba(255,255,255,0.18)] bg-white/10'}`}
                      >
                        <span className={`h-5 w-5 rounded-full bg-white transition-transform ${masterNotificationsEnabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-4 py-3">
                      <p className="pl-12 text-[13px] text-white">Likes & Comments</p>
                      <button
                        type="button"
                        onClick={() => setLikesCommentsEnabled((v) => !v)}
                        className={`inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border p-[2px] transition-colors ${likesCommentsEnabled ? 'border-emerald-300/40 bg-emerald-500/70' : 'border-[rgba(255,255,255,0.18)] bg-white/10'}`}
                      >
                        <span className={`h-5 w-5 rounded-full bg-white transition-transform ${likesCommentsEnabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="px-1 text-[10px] font-semibold tracking-[0.08em] text-white/55 uppercase">Privacy</h2>
                  <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.1)]"><Eye size={16} className="text-white" /></div>
                        <p className="text-[14px] text-white">Account Visibility</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAccountVisible((v) => !v)}
                        className={`inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border p-[2px] transition-colors ${accountVisible ? 'border-emerald-300/40 bg-emerald-500/70' : 'border-[rgba(255,255,255,0.18)] bg-white/10'}`}
                      >
                        <span className={`h-5 w-5 rounded-full bg-white transition-transform ${accountVisible ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {['Who can see designs', 'Blocked Users', 'Data Permissions'].map((row) => (
                      <button key={row} type="button" className="flex w-full items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-4 py-3 text-left hover:bg-white/5">
                        <p className="pl-12 text-[13px] text-white">{row}</p>
                        <ChevronRight size={15} className="text-white/35" />
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="px-1 text-[10px] font-semibold tracking-[0.08em] text-white/55 uppercase">Account & Billing</h2>
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black"><Sparkles size={16} /></div>
                        <div>
                          <p className="text-[14px] text-white">Pro Plan</p>
                          <p className="text-[11px] text-white/45">Renews Oct 24, 2024</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white/20 px-2 py-1 text-[9px] font-semibold tracking-[0.08em] text-white uppercase">Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" className="rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.1)] py-2 text-[10px] font-semibold text-white">Manage Subscription</button>
                      <button type="button" className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] py-2 text-[10px] font-semibold text-white/75">Cancel Subscription</button>
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="px-1 text-[10px] font-semibold tracking-[0.08em] text-white/55 uppercase">App Preferences</h2>
                  <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.1)]"><Moon size={16} className="text-white" /></div>
                        <p className="text-[14px] text-white">Dark Mode</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDarkModeEnabled((v) => !v)}
                        className={`inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border p-[2px] transition-colors ${darkModeEnabled ? 'border-emerald-300/40 bg-emerald-500/70' : 'border-[rgba(255,255,255,0.18)] bg-white/10'}`}
                      >
                        <span className={`h-5 w-5 rounded-full bg-white transition-transform ${darkModeEnabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <button type="button" className="flex w-full items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-4 py-3 text-left hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.1)]"><Languages size={16} className="text-white" /></div>
                        <p className="text-[14px] text-white">Language</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/45">English (US)</span>
                        <ChevronRight size={15} className="text-white/35" />
                      </div>
                    </button>
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="px-1 text-[10px] font-semibold tracking-[0.08em] text-white/55 uppercase">Support & Legal</h2>
                  <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)]">
                    <button
                      type="button"
                      onClick={() => setSupportModalOpen(true)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle size={15} className="text-white/85" />
                        <p className="text-[13px] text-white">Contact Support</p>
                      </div>
                      <ExternalLink size={15} className="text-white/35" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentView('helpCenter')}
                      className="flex w-full items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-4 py-3 text-left hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={15} className="text-white/85" />
                        <p className="text-[13px] text-white">FAQ</p>
                      </div>
                      <ChevronRight size={15} className="text-white/35" />
                    </button>
                    <button type="button" className="flex w-full items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-4 py-3 text-left hover:bg-white/5">
                      <div className="flex items-center gap-3"><FileText size={15} className="text-white/85" /><p className="text-[13px] text-white">Terms of Service</p></div>
                      <ChevronRight size={15} className="text-white/35" />
                    </button>
                    <button type="button" className="flex w-full items-center justify-between border-t border-[rgba(255,255,255,0.06)] px-4 py-3 text-left hover:bg-white/5">
                      <div className="flex items-center gap-3"><Shield size={15} className="text-white/85" /><p className="text-[13px] text-white">Privacy Policy</p></div>
                      <ChevronRight size={15} className="text-white/35" />
                    </button>
                  </div>
                </section>

                <section className="space-y-2 pt-2">
                  <h2 className="px-1 text-[10px] font-semibold tracking-[0.08em] text-[#f87171] uppercase">Danger Zone</h2>
                  <div className="overflow-hidden rounded-2xl border border-[rgba(248,113,113,0.25)] bg-[rgba(127,29,29,0.08)]">
                    <button type="button" onClick={logout} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[rgba(248,113,113,0.06)]">
                      <div className="flex items-center gap-3"><LogOut size={15} className="text-[#f87171]" /><p className="text-[13px] text-[#f87171]">Logout</p></div>
                      <ChevronRight size={15} className="text-[#f87171]/40" />
                    </button>
                    <button type="button" className="flex w-full items-center justify-between border-t border-[rgba(248,113,113,0.18)] px-4 py-3 text-left hover:bg-[rgba(248,113,113,0.08)]">
                      <div className="flex items-center gap-3"><Trash2 size={15} className="text-[#f87171]" /><p className="text-[13px] text-[#f87171]">Delete Account</p></div>
                      <ChevronRight size={15} className="text-[#f87171]/40" />
                    </button>
                  </div>
                </section>

                <p className="py-6 text-center text-[10px] text-white/35">Version 4.2.1-stable • Build 892</p>
              </main>
            </div>
          </motion.div>
        )}

        {/* ── HELP CENTER / FAQ (from Settings) ─────────────────────────────── */}
        {currentView === 'helpCenter' && (
          <motion.div
            key="helpCenter"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 z-[15] flex min-h-0 flex-col overflow-hidden bg-[#0f0d0b]"
          >
            <HelpCenterScreen
              onBack={() => setCurrentView('settings')}
              onToggleMenu={() => setIsMobileNavOpen((v) => !v)}
              menuOpen={isMobileNavOpen}
              onContactSupport={() => {
                setIsMobileNavOpen(false);
                setSupportModalOpen(true);
              }}
            />
          </motion.div>
        )}

        {/* ── BILLING & INVOICES (from drawer → Billing) ─────────────────────── */}
        {currentView === 'billing' && (
          <motion.div
            key="billing"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 z-[15] flex min-h-0 flex-col overflow-hidden"
          >
            <BillingScreen
              onBack={() => setCurrentView(isSpaciaLoggedIn() ? 'home' : 'landing')}
              onToggleMenu={() => setIsMobileNavOpen((v) => !v)}
              menuOpen={isMobileNavOpen}
              onContactSupport={() => {
                setIsMobileNavOpen(false);
                setSupportModalOpen(true);
              }}
            />
          </motion.div>
        )}

        {/* ── GALLERY VIEW (mobile) ─────────────────────────────────────────── */}
        {currentView === 'gallery' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 bg-[#070a0f]"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(35,22,10,0.5)] blur-[90px]" />
              <div className="absolute top-1/3 -left-16 h-64 w-64 rounded-full bg-[rgba(12,26,44,0.42)] blur-[110px]" />
              <div className="absolute bottom-24 right-[-80px] h-64 w-64 rounded-full bg-[rgba(45,27,12,0.35)] blur-[120px]" />
            </div>
            <div className="relative h-full w-full overflow-y-auto pb-28">
              <main className="mx-auto w-full max-w-[430px] px-4 py-4">
                <header className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#f0b35f]/40 bg-[linear-gradient(135deg,#2f1a0a,#11141a)] text-[#f2ba68] shadow-[0_0_0_1px_rgba(242,186,104,0.08)]">
                    ✦
                  </div>
                  <div className="text-center">
                    <h1 className="text-[30px] leading-none font-semibold text-[#f5f7fb]">Gallery</h1>
                    <p className="mt-1 text-[12px] text-[#b8c0cc]">Explore beautiful spaces for inspiration</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen((v) => !v)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-[rgba(255,255,255,0.05)] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    aria-label="Toggle menu"
                  >
                    {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                </header>

                <div className="mb-3 flex gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/12 bg-[rgba(255,255,255,0.05)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Search size={16} className="text-[#a8b0bc]" />
                    <input
                      value={gallerySearch}
                      onChange={(e) => setGallerySearch(e.target.value)}
                      placeholder="Search designs, styles, rooms..."
                      className="w-full bg-transparent text-[13px] text-[#e8ecf2] placeholder:text-[#9aa3af] focus:outline-none"
                    />
                  </div>
                  <button type="button" className="inline-flex items-center gap-1 rounded-xl border border-white/12 bg-[rgba(255,255,255,0.06)] px-3 text-[13px] text-[#d8deea] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <Funnel size={14} />
                    Filter
                  </button>
                </div>

                <div className="mb-3 rounded-xl border border-white/12 bg-[rgba(255,255,255,0.04)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="grid grid-cols-3 gap-1">
                    {(['Explore', 'My Gallery', 'Saved'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setGalleryTab(tab)}
                        className={`rounded-lg px-2 py-2 text-[12px] ${
                          galleryTab === tab
                            ? 'bg-[linear-gradient(135deg,rgba(232,172,91,0.22),rgba(232,172,91,0.1))] text-[#f4c785]'
                            : 'text-[#bcc5d1]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {galleryTab === 'Explore' ? (
                  <section aria-label="Home feed" className="pt-2">
                    <nav className="hide-scrollbar flex gap-3 overflow-x-auto pb-5">
                      {[
                        { label: 'For You', active: true },
                        { label: 'Modernist', active: false },
                        { label: 'Minimalist', active: false },
                        { label: 'Japandi', active: false },
                        { label: 'Industrial', active: false },
                      ].map((t) => (
                        <button
                          key={t.label}
                          type="button"
                          className={
                            t.active
                              ? 'flex-shrink-0 rounded-full border border-[#E8873A]/20 bg-[#E8873A]/10 px-5 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#E8873A]'
                              : 'flex-shrink-0 rounded-full border border-white/12 bg-[rgba(255,255,255,0.03)] px-5 py-2 text-[12px] font-semibold tracking-[0.05em] text-[#bcc5d1] transition-colors hover:text-[#E8873A]'
                          }
                        >
                          {t.label}
                        </button>
                      ))}
                    </nav>

                    <div className="grid grid-cols-2 items-start gap-4">
                      <div className="flex flex-col gap-4">
                        <article className="relative aspect-[3/5] overflow-hidden rounded-[18px] border border-white/12 bg-[rgba(255,255,255,0.04)] shadow-[0_12px_34px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.05)]">
                          <img
                            alt=""
                            className="h-full w-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsrvdipvORdCJnUqBClI6sItrDAYQlPepHI4aUa5ttrNgtS8PTS2QkIrxe-JuO8XzPnDxpb40g7-EAfxponlV-27PNLnMwH39uEzbXQfwQFoefkbhGkYW5z3x70DiaHGoVt2tY_wT73PghZJVZGk2b_MkSJ-iR8u_Er3Dc8n2sQuO8dnfUZuGKbUWbsB-8ylmdAZBjUqqORzpNRFM_YmUYT5BqiQk4tV_oDhW6iNCzRlzrYRIHQfnw1CAO2CcdBf6Zr3e4FWfUFnnq"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070a0f]/85 to-transparent" />
                          <button
                            type="button"
                            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-[rgba(8,10,14,0.55)] text-white/90"
                            aria-label="Save"
                          >
                            <Bookmark size={16} />
                          </button>
                          <div className="absolute left-3 bottom-3 inline-flex items-center gap-2 rounded-full border border-white/14 bg-[rgba(8,10,14,0.55)] px-3 py-1 text-[12px] text-white/90">
                            <span className="text-white/80">♡</span>
                            <span className="font-medium">231</span>
                          </div>
                        </article>

                        <article className="overflow-hidden rounded-[18px] border border-white/12 bg-[rgba(255,255,255,0.04)] shadow-[0_12px_34px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)]">
                          <div className="relative h-48">
                            <img
                              alt=""
                              className="h-full w-full object-cover"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC887MVMO9v5h2WWZNFqUgRFmgCgXtMFuCwXHkiQlAW0JE3e1DZfcipzRgFl7NueRGqZuceRT0MKFVGmRG4MV9wT7kozukRyqHwsk859oddaJ0VaUGWoq4P5k7DCPzMCQcjXZkuQETRuwhejrUE6hjIWujajlfpx0TgUkTo2TMdVrxxajMNtlKKF1jTQeunRZQ84yxlAtG3tkiqSYdfF34w7HzpCooloJpwH5dmNedhzbEyMN0LWe73WxLvCeBZM5HruidFZH2PWShj"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070a0f]/88 to-transparent" />
                            <button
                              type="button"
                              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-[rgba(8,10,14,0.55)] text-white/90"
                              aria-label="Save"
                            >
                              <Bookmark size={16} />
                            </button>
                            <div className="absolute left-3 bottom-3 inline-flex items-center gap-2 rounded-full border border-white/14 bg-[rgba(8,10,14,0.55)] px-3 py-1 text-[12px] text-white/90">
                              <span className="text-white/80">♡</span>
                              <span className="font-medium">189</span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="text-[14px] font-semibold text-[#edf1f7]">Warm Japandi Living...</div>
                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#a8b0bc]">
                              Interior Design
                            </div>
                          </div>
                        </article>

                        <article className="overflow-hidden rounded-[18px] border border-white/12 bg-[rgba(255,255,255,0.04)] shadow-[0_12px_34px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)]">
                          <div className="relative aspect-square">
                            <img
                              alt=""
                              className="h-full w-full object-cover"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoENoDSDGStCSPpcYVfiG23kEcMCSbK7Diz025_ypEVntZV6XA3IBhCLD8X0Gurax7rb7w4ondbGfEaEkb_O_9NuwWOc4Bxp03jC8EnvFf4umME7X-m2OaNQktAMYwISLlQL3i3LEs4klERicBzvkkRTBeHylIkdmWiAiIf7mFXHk-2JT5k-MFZkughKRMw3Duwh4V0ymlC8WngSyJebeedgjvrySmLmCqthr0X7xs8V7bu95KMFDDTll1hwTAsu3G8Mdty_M0Y1wM"
                            />
                            <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded bg-[#E8873A] px-2 py-1 text-[10px] font-bold text-black">
                              <Sparkles size={12} />
                              AI
                            </div>
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070a0f]/86 to-transparent" />
                            <button
                              type="button"
                              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-[rgba(8,10,14,0.55)] text-white/90"
                              aria-label="Save"
                            >
                              <Bookmark size={16} />
                            </button>
                            <div className="absolute left-3 bottom-3 inline-flex items-center gap-2 rounded-full border border-white/14 bg-[rgba(8,10,14,0.55)] px-3 py-1 text-[12px] text-white/90">
                              <span className="text-white/80">♡</span>
                              <span className="font-medium">156</span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="text-[14px] font-semibold text-[#edf1f7]">Boho Study Nook Idea</div>
                          </div>
                        </article>
                      </div>

                      <div className="flex flex-col gap-4">
                        <article className="relative -mt-8 h-36 overflow-hidden rounded-[18px] border border-white/12 bg-[rgba(255,255,255,0.04)] shadow-[0_12px_34px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)]">
                          <img
                            alt=""
                            className="h-full w-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuARkFZsMo1c1xTw3KdmMdQyFfntkpjK3Na3WKiTAjwyCR3gYwDjBcmzfR2eIfOuBmmrmd4ofDLHJ3e0PaM6wvqKopfj_pWmOp3OpC6LKk9mkmI2qqjY_CklzJBcGr7iWngJPOJEzFNizMYwUjMmTmSkFDfV4aaHrRyN5Hx39ylCDwpZi_c5jo4NrQfS1bX5zu7J-GkH2fyMjVmzsXUk_lS1041Tts_gc2IzZyWWp1iF93tEQ_nvKyDeGH1UKf-JgVog0I_Eb0undpNB"
                          />
                          <div className="absolute right-3 top-10 rounded-full bg-[#E8873A] px-2 py-1 text-[10px] font-bold text-black">
                            ₹3,200
                          </div>
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070a0f]/86 to-transparent" />
                          <button
                            type="button"
                            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-[rgba(8,10,14,0.55)] text-white/90"
                            aria-label="Save"
                          >
                            <Bookmark size={16} />
                          </button>
                          <div className="absolute left-3 bottom-3 inline-flex items-center gap-2 rounded-full border border-white/14 bg-[rgba(8,10,14,0.55)] px-3 py-1 text-[12px] text-white/90">
                            <span className="text-white/80">♡</span>
                            <span className="font-medium">142</span>
                          </div>
                        </article>

                        <article className="overflow-hidden rounded-[18px] border border-white/12 bg-[rgba(255,255,255,0.04)] shadow-[0_12px_34px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)]">
                          <div className="relative aspect-[3/4]">
                            <img
                              alt=""
                              className="h-full w-full object-cover"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCng3hG4YjFJkZ3G2fKpIu7CwYlr3bvr7fX0s6UuTYLQvP3a4sH0c3ZcVG35g5h7uH3uYfK3B1YpXlQ2d8tYj1I9B2kYqQ2mQqv7e8q3nMmtbKcS3b0F9mGQ3zD6Zr_0b9rQe7Jg0xQ9oYq6Qh7l9n0kJm2D9e5g"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070a0f]/88 to-transparent" />
                            <button
                              type="button"
                              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-[rgba(8,10,14,0.55)] text-white/90"
                              aria-label="Save"
                            >
                              <Bookmark size={16} />
                            </button>
                            <div className="absolute left-3 bottom-3 inline-flex items-center gap-2 rounded-full border border-white/14 bg-[rgba(8,10,14,0.55)] px-3 py-1 text-[12px] text-white/90">
                              <span className="text-white/80">♡</span>
                              <span className="font-medium">189</span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="text-[14px] font-semibold text-[#edf1f7]">Midnight Velvet Suite</div>
                          </div>
                        </article>

                        <article className="overflow-hidden rounded-[18px] border border-white/12 bg-[rgba(255,255,255,0.04)] shadow-[0_12px_34px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)]">
                          <div className="relative aspect-[4/5]">
                            <img
                              alt=""
                              className="h-full w-full object-cover"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8wT7k8xQeWz3n3p9H2m4LwqYg0l2lqV3b9tQw0sF4r8mJ2n2kK7xTQw8R4c9K0xv3o2t7Qw9t7N2b0"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070a0f]/86 to-transparent" />
                            <button
                              type="button"
                              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-[rgba(8,10,14,0.55)] text-white/90"
                              aria-label="Save"
                            >
                              <Bookmark size={16} />
                            </button>
                            <div className="absolute left-3 bottom-3 inline-flex items-center gap-2 rounded-full border border-white/14 bg-[rgba(8,10,14,0.55)] px-3 py-1 text-[12px] text-white/90">
                              <span className="text-white/80">♡</span>
                              <span className="font-medium">98</span>
                            </div>
                            <button
                              type="button"
                              className="absolute inset-0 flex items-center justify-center"
                              aria-label="Play"
                            >
                              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/18 bg-[rgba(8,10,14,0.55)] text-white">
                                <span className="ml-1 block h-0 w-0 border-y-[7px] border-y-transparent border-l-[11px] border-l-white/85" />
                              </span>
                            </button>
                          </div>
                        </article>
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="grid grid-cols-2 gap-3">
                    {visibleGalleryCards.map((card) => (
                      <article key={card.title} className="overflow-hidden rounded-xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_12px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="relative aspect-[1.08] w-full overflow-hidden">
                          <img src={card.img} alt={card.title} className="h-full w-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#08090d]/80 to-transparent" />
                          {card.ai && (
                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/16 bg-[rgba(8,10,14,0.7)] px-2 py-1 text-[10px] text-white">
                              <Sparkles size={10} />
                              AI Generated
                            </span>
                          )}
                          <button className="absolute right-2 top-2 rounded-full border border-white/20 bg-[rgba(8,10,14,0.68)] p-1.5 text-white/90">
                            <Bookmark size={12} />
                          </button>
                        </div>
                        <div className="px-2.5 py-2.5">
                          <h3 className="truncate text-[14px] font-medium text-[#edf1f7]">{card.title}</h3>
                          <p className="mt-0.5 text-[11px] text-[#a8b0bc]">{card.style} · {card.room}</p>
                          <div className="mt-2 flex items-center justify-between text-[12px] text-[#d8deea]">
                            <span>♡ {card.likes}</span>
                            <Bookmark size={12} className="text-[#e8ac5b]" />
                          </div>
                        </div>
                      </article>
                    ))}
                  </section>
                )}

                <button className="fixed bottom-24 right-6 z-[65] flex h-14 w-14 items-center justify-center rounded-full border border-[#f4c37f]/40 bg-[linear-gradient(135deg,#f0bf71,#de9834)] text-white shadow-[0_14px_28px_rgba(232,172,91,0.38)]">
                  <Plus size={25} />
                </button>
              </main>
            </div>
          </motion.div>
        )}

        {/* ── CONTEST VIEW (mobile) ─────────────────────────────────────────── */}
        {currentView === 'contest' && (
          <motion.div
            key="contest"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 z-[15] overflow-hidden bg-[#0B0B0D]"
          >
            <div className="relative h-full w-full overflow-y-auto">
              <ContestScreen
                onBack={() => setCurrentView('home')}
                onOpenMenu={() => setIsMobileNavOpen(true)}
              />
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

                /* Custom Room Components (arrangement): land on customise with reference image + Edit/Add/Replace/Erase.
                   Full-room (purpose): show generation results first, then Finalize → customise. */
                const arrangementFlow = payload.configMode === 'arrangement';
                if (arrangementFlow) {
                  setCustomActiveTab('Edit');
                  setCurrentView('customisation');
                } else {
                  setCustomActiveTab(null);
                  setCurrentView('results');
                }

                // Never auto-call /api/generate when the wizard finishes. The upload stays as-is until the user
                // taps Regenerate or runs Edit / Add / Replace / Erase (same expectation for purpose + arrangement).
                setWizardApiPending(false);
                setWizardApiError(null);
                setWizardServerWarning(null);
                setWizardSuppressInitialScan(false);
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
            <div
              className={
                isMobileHome
                  ? 'absolute left-0 right-0 top-[48px] bottom-0 z-[1]'
                  : 'absolute left-[127px] top-[78px] w-[1289px] h-[657px] z-[1]'
              }
              style={isMobileHome ? { padding: '8px 8px 10px' } : undefined}
            >
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
                  setCustomActiveTab((prev) => prev ?? 'Edit');
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
            <div
              className={
                isMobileHome
                  ? 'absolute left-0 right-0 top-[48px] bottom-0 z-[1]'
                  : 'absolute left-[127px] top-[78px] w-[1289px] h-[657px] z-[1]'
              }
              style={isMobileHome ? { padding: '8px 8px 10px', overflow: 'hidden' } : { overflow: 'visible' }}
            >
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

      {/* Global hamburger drawer — mobile everywhere; also billing on wider viewports */}
      {(isMobileHome || currentView === 'billing') && (
        <AnimatePresence>
          {isMobileNavOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-[110]"
            >
              <button
                type="button"
                className="absolute inset-0 bg-[rgba(0,0,0,0.52)] backdrop-blur-[4px]"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close menu backdrop"
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
                className={`absolute right-0 top-0 flex w-[82%] max-w-[350px] flex-col rounded-l-[20px] border-l border-[rgba(255,255,255,0.13)] bg-[rgba(12,12,12,0.92)] px-4 py-5 shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-[16px] ${
                  ['landing', 'login', 'verify'].includes(currentView) ||
                  (currentView === 'billing' && !isMobileHome)
                    ? 'bottom-0'
                    : 'bottom-[calc(74px+env(safe-area-inset-bottom))]'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(145deg,#262626,#161616)] text-white/90">
                      <User size={22} />
                    </div>
                    <div>
                      <p className="text-[22px] leading-[1.05] font-semibold tracking-[-0.2px] text-white">Madhunala</p>
                      <p className="text-[22px] leading-[1.05] font-semibold tracking-[-0.2px] text-white">Navya</p>
                      <p className="mt-1 text-[10px] font-semibold tracking-[2.4px] text-white/55 uppercase">Premium Member</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] text-white/80"
                    aria-label="Close menu"
                  >
                    <X size={17} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    setCurrentView('profile');
                  }}
                  className="mb-4 inline-flex w-fit items-center gap-2 text-[16px] text-white/65 transition-colors duration-200 hover:text-white"
                >
                  View Profile
                  <ChevronRight size={15} />
                </button>

                <div className="mb-4 h-px bg-white/10" />

                <div className="flex min-h-0 flex-1 flex-col">
                  <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-1">
                    {mobileDrawerItems.map(({ label, Icon, active, onClick }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setIsMobileNavOpen(false);
                          onClick?.();
                        }}
                        className={`flex h-[54px] w-full shrink-0 items-center gap-3 rounded-xl border px-4 text-left transition-all duration-200 ${
                          active
                            ? 'border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.14)] text-white'
                            : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.06)] text-white/55 hover:bg-[rgba(255,255,255,0.12)] hover:text-white'
                        }`}
                      >
                        <Icon size={17} />
                        <span className="text-[16px] font-medium">{label}</span>
                      </button>
                    ))}
                  </nav>

                  <div className="mt-5 shrink-0 border-t border-[rgba(255,255,255,0.08)] pt-5 pb-1">
                    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-2">
                      <button
                        type="button"
                        onClick={logout}
                        className="flex h-[54px] w-full items-center gap-3 rounded-xl border border-[rgba(239,68,68,0.36)] bg-[linear-gradient(90deg,rgba(127,29,29,0.42)_0%,rgba(127,29,29,0.28)_100%)] px-4 text-[16px] font-medium text-[#f87171]"
                      >
                        <LogOut size={17} />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      )}

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
      {!(isMobileHome && (currentView === 'landing' || currentView === 'home' || currentView === 'login' || currentView === 'verify' || currentView === 'profile' || currentView === 'createPost' || currentView === 'followers' || currentView === 'settings' || currentView === 'helpCenter' || currentView === 'billing' || currentView === 'gallery' || currentView === 'contest')) && (
        <AppHeader
          onBack={
            currentView === 'roomConfig' && backStepHandler
              ? backStepHandler
              : currentView === 'roomConfig'
              ? () => setCurrentView(isSpaciaLoggedIn() ? 'home' : 'landing')
              : currentView === 'profile'
              ? () => setCurrentView(isSpaciaLoggedIn() ? 'home' : 'landing')
              : currentView === 'results'
              ? () => {
                  setReturnToPreferences(true);
                  setCurrentView('roomConfig');
                }
              : currentView === 'customisation'
              ? () => setCurrentView('results')
              : currentView === 'billing'
              ? () => setCurrentView(isSpaciaLoggedIn() ? 'home' : 'landing')
              : undefined
          }
          onNext={nextStepHandler || undefined}
          onMenu={
            isMobileHome && ['roomConfig', 'results', 'customisation'].includes(currentView)
              ? () => setIsMobileNavOpen(true)
              : undefined
          }
        />
      )}
      {!isMobileHome && <AppSidebar />}

      {isMobileHome && !(['landing','login','verify'].includes(currentView)) && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/[0.1] bg-[rgba(10,10,12,0.92)] pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-[18px]">
          <div className="mx-auto grid max-w-[430px] grid-cols-5 gap-0.5 px-3">
            {[
              { label: 'Home', Icon: Home, active: currentView === 'home', onClick: () => setCurrentView('home') },
              { label: 'Projects', Icon: FolderKanban, active: false, onClick: () => {} },
              {
                label: 'Imagine',
                Icon: Sparkles,
                active: currentView === 'landing' || ['roomConfig', 'results', 'customisation'].includes(currentView),
                onClick: () => setCurrentView('imagineStart'),
              },
              { label: 'Gallery', Icon: Images, active: currentView === 'gallery', onClick: () => setCurrentView('gallery') },
              { label: 'Contest', Icon: Trophy, active: currentView === 'contest', onClick: () => setCurrentView('contest') },
            ].map(({ label, Icon, active, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[12px] px-0.5 transition-colors ${
                  active
                    ? label === 'Gallery' || label === 'Contest'
                      ? 'border border-[rgba(251,146,60,0.35)] bg-[rgba(251,146,60,0.1)] text-[#fdba74]'
                      : label === 'Imagine'
                        ? 'border border-[rgba(251,146,60,0.22)] bg-[rgba(251,146,60,0.08)] text-[#fed7aa]'
                        : 'border border-white/[0.08] bg-white/[0.08] text-white'
                    : 'border border-transparent text-white/[0.55] hover:bg-white/[0.04] hover:text-white/80'
                }`}
              >
                <Icon size={label === 'Imagine' ? 19 : 18} strokeWidth={active ? 2.25 : 2} className={active ? '' : 'opacity-90'} />
                <span className="text-[10px] font-semibold leading-none tracking-wide">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── SPACIA LOGIN VIEW (Vite UI) ───────────────────────────────────── */}
      {currentView === 'login' && (
        <motion.div
          key="spacia-login"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-0 bg-[#1A1510] text-[#F5F0E8]"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[45%] overflow-hidden">
              <img
                alt=""
                className="w-full h-full object-cover opacity-60 scale-110 blur-xl mix-blend-luminosity"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1UU98rYsK8SyyDDfJg5bGJSm__C4a8UjHygOr3lkn8Lc2vL2j0K0Op3cUyuiEZv7i2XJGpBLpKAGTsfLZYbm8lDsZCg9KDBQEFxWbEPH2bta1el6BlsSP70JzjKJvQszHRPtdGIOJyK78DuRZI4_kdEc1TdH12YWQhXlbkpn5ilHBkzyPEuxjLwNS5PVhP0MSwgfIpYV-QFr-UQKs_mmkx5ZOidkW4N-FpnQy1r2nsKnZ7Y-AbhSZ4bFA_lI7Cqtb2D6stNUsm_kE"
              />
            </div>
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/20 rounded-full blur-[80px] mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1A1510]/55 via-[#1A1510]/95 to-[#1A1510]" />
          </div>

          <div className="relative z-10 flex flex-col min-h-screen px-5 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] max-w-[460px] mx-auto">
            <header className={`mb-10 flex w-full items-center ${isMobileHome ? 'justify-between' : 'justify-start'}`}>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCurrentView(isSpaciaLoggedIn() ? 'home' : 'landing')}
                className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.07] backdrop-blur-[16px] transition-colors hover:bg-white/[0.12]"
              >
                <X size={18} />
              </button>
              {isMobileHome ? (
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen((v) => !v)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] text-white"
                  aria-label="Toggle menu"
                >
                  {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              ) : null}
            </header>

            <div className="flex flex-col items-center justify-center mb-8">
              <div className="w-[50px] h-[50px] rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                {/* brand mark removed */}
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[22px] font-semibold tracking-tight text-[#F5F0E8]">Vision</div>
                <div className="w-[28px] h-[2px] bg-amber-500 mt-2 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </div>
            </div>

            <div className="text-center mb-8">
              <div className="text-[32px] font-bold text-[#F5F0E8]">Welcome Back</div>
              <div className="mt-2 text-[16px] text-white/60">Your space awaits.</div>
            </div>

            <div className="bg-[#252018]/80 backdrop-blur-[16px] rounded-[20px] p-5 border border-white/[0.06] shadow-2xl">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-white/55">Region</div>
                  <button
                    type="button"
                    onClick={() => alert('Country selector coming soon.')}
                    className="w-full bg-[#1E1812] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🇮🇳</span>
                      <span className="text-[16px] font-medium text-[#F5F0E8]">{spaciaCountryCode}</span>
                      <span className="w-[1px] h-4 bg-white/[0.1]" />
                      <span className="text-[16px] font-medium text-[#F5F0E8]">India</span>
                    </div>
                    <ChevronDown size={18} className="text-white/50" />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-white/55">Phone Number</div>
                  <div className="relative flex items-center w-full bg-[#1E1812] border border-amber-500/50 rounded-xl overflow-hidden focus-within:border-amber-500 focus-within:shadow-[0_0_0_1px_rgba(245,158,11,0.5)] transition-all">
                    <div className="pl-4 pr-3 flex items-center justify-center text-amber-500">
                      <Phone size={18} />
                    </div>
                    <div className="flex items-center gap-2 py-4">
                      <span className="text-[18px] text-white/60 select-none">{spaciaCountryCode}</span>
                      <span className="w-[1px] h-4 bg-white/[0.1] select-none" />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      className="flex-1 bg-transparent border-none text-[#F5F0E8] text-[18px] focus:ring-0 placeholder:text-white/25 py-4 px-2 tracking-wide outline-none"
                      placeholder="00000 00000"
                      value={spaciaPhoneDigits.length > 5 ? `${spaciaPhoneDigits.slice(0,5)} ${spaciaPhoneDigits.slice(5,10)}` : spaciaPhoneDigits}
                      onChange={(e) => {
                        setSpaciaError(null);
                        const d = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setSpaciaPhoneDigits(d);
                      }}
                    />
                  </div>
                  <div className="text-[12px] text-white/45 flex items-center gap-2">
                    <Info size={14} />
                    We&apos;ll send a 6-digit OTP to verify your number
                  </div>
                  {spaciaError && (
                    <div className="text-[12px] font-semibold text-red-400">{spaciaError}</div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={spaciaSendLoading || spaciaPhoneDigits.length !== 10}
                  onClick={async () => {
                    if (spaciaSendLoading) return;
                    if (spaciaPhoneDigits.length !== 10) {
                      setSpaciaError('Phone number must be exactly 10 digits.');
                      return;
                    }
                    setSpaciaSendLoading(true);
                    setSpaciaError(null);
                    try {
                      const phoneNumber = spaciaPhoneDigits;
                      const res = await fetch(buildApiUrl('/api/send-otp'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phoneNumber }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok || data?.ok !== true) throw new Error(data?.error || 'Failed to send OTP.');
                      setSpaciaOtpDigits(['','','','','','']);
                      setSpaciaTimer(30);
                      setCurrentView('verify');
                      setTimeout(() => spaciaOtpRefs.current[0]?.focus(), 60);
                    } catch (e) {
                      setSpaciaError(e instanceof Error ? e.message : 'Failed to send OTP.');
                    } finally {
                      setSpaciaSendLoading(false);
                    }
                  }}
                  className="w-full mt-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black/90 font-semibold rounded-xl py-4 px-6 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(245,158,11,0.2)] transition-all active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {spaciaSendLoading ? 'Sending…' : 'Send OTP'}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── SPACIA OTP VERIFY VIEW (Vite UI) ─────────────────────────────── */}
      {currentView === 'verify' && (
        <motion.div
          key="spacia-verify"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-0 bg-[#1A1510] text-[#F5F0E8]"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 h-[45%]"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA23YRBDcLoz_fSV-y03CgWk4JgBalAtUGz6obRdPoZHox2ZrhB1DQyXfCQ9ku1wtdXSIeweC0Yqemv2mzzPbxGX_fQTUj-HXylG39k0o99LgD1kJZdKvFk1-0YyUiInNfvQJiUXjZin1Ynn9PaOqpUQWCPiCCX9bCuc1YWOkCrwyv-pY5kMi__Y80_HXamUxjSoLwJ-EfNTcot9DW7aMMmYAdMCQe-GnXxvRiIMDxrVmzd7M7N_R2OJdupTkG9g19Uwc5K6ksGmvsu')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1A1510]/55 via-[#1A1510]/95 to-[#1A1510]" />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(232,135,58,0.10) 0%, transparent 100%)' }} />
          </div>

          <div className="relative z-10 flex flex-col min-h-screen px-5 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] max-w-[460px] mx-auto">
            <div className={`flex w-full items-center ${isMobileHome ? 'justify-between' : 'justify-start'}`}>
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md transition-transform active:scale-95"
                aria-label="Go back"
                disabled={spaciaVerifyLoading}
              >
                <ArrowLeft size={18} />
              </button>
              {isMobileHome ? (
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen((v) => !v)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] text-white"
                  aria-label="Toggle menu"
                >
                  {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              ) : null}
            </div>

            <div className="flex flex-col items-center mt-8 mb-5">
              <div className="w-[50px] h-[50px] rounded-[14px] bg-[#E8873A] grid grid-cols-2 gap-1 p-2.5 shadow-lg shadow-black/20">
                <div className="bg-white rounded-sm" />
                <div className="bg-white rounded-sm" />
                <div className="bg-white rounded-sm" />
                <div className="bg-white rounded-sm" />
              </div>
              <div className="text-[22px] text-[#F5F0E8] mt-3 font-semibold">Vision</div>
              <div className="w-[28px] h-[1.5px] bg-[#E8873A] mt-2 rounded-full" />
            </div>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="text-[30px] font-bold text-[#F5F0E8] mb-1">Verify Number</div>
              <div className="text-[14px] text-white/55 mb-2">OTP sent to {spaciaCountryCode}{spaciaPhoneDigits}</div>
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className="text-[13px] text-[#E8873A] underline decoration-[#E8873A]/50"
              >
                Change number
              </button>
            </div>

            <div className="bg-[#252018]/80 border border-white/5 rounded-[20px] p-[24px_18px] shadow-2xl shadow-black/40 backdrop-blur-md flex flex-col items-center w-full mb-6">
              <div className="flex gap-2 w-full justify-center mb-6">
                {spaciaOtpDigits.map((d, idx) => (
                  <div
                    key={idx}
                    className={[
                      'w-[44px] h-[58px] bg-[#1E1812] rounded-[12px] flex items-center justify-center relative',
                      idx === 0 ? '' : '',
                      idx === 0 ? '' : '',
                      idx === 0 ? '' : '',
                      idx === 0 ? '' : '',
                      idx === 0 ? '' : '',
                      idx === 0 ? '' : '',
                      idx === spaciaOtpDigits.findIndex((x) => x === '') ? 'border-[1.5px] border-[#E8873A] shadow-[0_0_12px_rgba(232,135,58,0.3)]' : d ? 'border-[1.5px] border-[#E8873A] shadow-[0_0_8px_rgba(232,135,58,0.2)]' : 'border border-white/10',
                    ].join(' ')}
                  >
                    <input
                      ref={(el) => { spaciaOtpRefs.current[idx] = el; }}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      disabled={spaciaVerifyLoading}
                      value={d}
                      className="absolute inset-0 w-full h-full bg-transparent text-center text-[26px] font-semibold outline-none text-[#F5F0E8] caret-transparent"
                      aria-label={`OTP digit ${idx + 1}`}
                      onChange={(e) => {
                        setSpaciaError(null);
                        const val = e.target.value.replace(/\D/g, '').slice(-1);
                        setSpaciaOtpDigits((prev) => {
                          const next = [...prev];
                          next[idx] = val;
                          return next;
                        });
                        if (val && idx < 5) spaciaOtpRefs.current[idx + 1]?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          if (spaciaOtpDigits[idx]) {
                            setSpaciaOtpDigits((prev) => {
                              const next = [...prev];
                              next[idx] = '';
                              return next;
                            });
                          } else if (idx > 0) {
                            spaciaOtpRefs.current[idx - 1]?.focus();
                          }
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData('text');
                        const clean = text.replace(/\D/g, '').slice(0, 6);
                        if (!clean) return;
                        setSpaciaOtpDigits(clean.split('').concat(Array(6 - clean.length).fill('')));
                        const focusAt = Math.min(5, clean.length);
                        setTimeout(() => spaciaOtpRefs.current[focusAt]?.focus(), 0);
                      }}
                    />
                    {idx === spaciaOtpDigits.findIndex((x) => x === '') && !d && (
                      <span className="text-[#E8873A] text-[26px] animate-pulse">|</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center text-[13px] gap-1 text-white/55">
                {spaciaTimer > 0 ? (
                  <>
                    <span>Didn&apos;t receive it?</span>
                    <span className="text-white/35 font-semibold">Resend in 0:{String(spaciaTimer).padStart(2, '0')}</span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (spaciaSendLoading) return;
                      setSpaciaSendLoading(true);
                      setSpaciaError(null);
                      try {
                        const phoneNumber = spaciaPhoneDigits;
                        const res = await fetch(buildApiUrl('/api/send-otp'), {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phoneNumber }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok || data?.ok !== true) throw new Error(data?.error || 'Failed to resend OTP.');
                        setSpaciaTimer(30);
                      } catch (e) {
                        setSpaciaError(e instanceof Error ? e.message : 'Failed to resend OTP.');
                      } finally {
                        setSpaciaSendLoading(false);
                      }
                    }}
                    className="text-[#E8873A] font-semibold underline decoration-[#E8873A]/50"
                    disabled={spaciaSendLoading}
                  >
                    {spaciaSendLoading ? 'Resending…' : 'Resend OTP'}
                  </button>
                )}
              </div>
            </div>

            {spaciaError && (
              <div className="text-[12px] font-semibold text-red-400 text-center mb-2">{spaciaError}</div>
            )}

            <div className="mt-auto flex flex-col gap-5">
              <button
                type="button"
                disabled={spaciaVerifyLoading || spaciaOtpDigits.some((x) => !x)}
                onClick={async () => {
                  if (spaciaVerifyLoading) return;
                  if (spaciaOtpDigits.some((x) => !x)) return;
                  setSpaciaVerifyLoading(true);
                  setSpaciaError(null);
                  try {
                    const phoneNumber = spaciaPhoneDigits;
                    const otp = spaciaOtpDigits.join('');
                    const res = await fetch(buildApiUrl('/api/verify-otp'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ phoneNumber, otp }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok || data?.ok !== true) throw new Error(data?.error || 'Invalid OTP. Please try again.');
                    persistSpaciaSessionAfterVerify(data);
                    setCurrentView('home');
                  } catch (e) {
                    setSpaciaError(e instanceof Error ? e.message : 'Invalid OTP. Please try again.');
                    setSpaciaOtpDigits(['','','','','','']);
                    setTimeout(() => spaciaOtpRefs.current[0]?.focus(), 60);
                  } finally {
                    setSpaciaVerifyLoading(false);
                  }
                }}
                className="w-full h-[56px] rounded-[14px] flex items-center justify-center gap-2 font-semibold text-white text-[16px] bg-gradient-to-br from-[#E8873A] to-[#C45E18] shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition-all active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {spaciaVerifyLoading ? 'Verifying…' : 'Verify & Continue'}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {!(isMobileHome && (isMobileNavOpen || currentView === 'profile' || currentView === 'createPost' || currentView === 'followers' || currentView === 'settings' || currentView === 'helpCenter' || currentView === 'billing' || currentView === 'gallery' || currentView === 'contest')) && (
        <div
          style={{
            position: 'fixed',
            right: isMobileHome ? 12 : 20,
            bottom: isMobileHome ? 92 : 22,
            zIndex: 70,
          }}
        >
          <button
            type="button"
            aria-label="Support"
            title="Support"
            onClick={() => setSupportModalOpen(true)}
            className="flex h-[64px] w-[64px] items-center justify-center bg-transparent text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
            style={{ borderRadius: 0 }}
          >
            <Headset size={24} strokeWidth={2} />
          </button>
        </div>
      )}

      {supportModalOpen && (
        <div
          onClick={closeSupportModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0,0,0,0.42)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px 12px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleSupportTouchStart}
            onTouchMove={handleSupportTouchMove}
            onTouchEnd={handleSupportTouchEnd}
            onTouchCancel={handleSupportTouchEnd}
            style={{
              width: 'min(460px, calc(100vw - 24px))',
              borderRadius: '24px',
              background: 'rgba(16,16,18,0.86)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
              padding: '18px 16px 16px',
              transform: `translateY(${supportDragY}px)`,
              transition: supportDragY > 0 ? 'none' : 'transform 220ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600, color: '#f5f5f5', lineHeight: 1.2 }}>
                  Need Help? Contact Us
                </div>
                <div style={{ marginTop: 4, fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.72)' }}>
                  We&apos;re here to assist you anytime
                </div>
              </div>
              <button
                type="button"
                onClick={closeSupportModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-label="Close contact support"
              >
                <X size={14} />
              </button>
            </div>

            <a
              href="tel:+918056539544"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = 'tel:+918056539544';
              }}
              style={{
                marginTop: 14,
                minHeight: 56,
                width: '100%',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.08)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <Phone size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff' }}>Call Support</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>8056539544</div>
              </div>
            </a>

            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=visionsupport@tatvaops.com&su=TatvaOps%20Support%20Request&body=Hi%20TatvaOps%20Support%2C%0A%0AIssue%20details%3A%0A"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: 10,
                minHeight: 56,
                width: '100%',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.08)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <Mail size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff' }}>Email Support</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>visionsupport@tatvaops.com</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Response within 24 hrs</div>
              </div>
            </a>

            <div
              style={{
                marginTop: 10,
                minHeight: 56,
                width: '100%',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxSizing: 'border-box',
                opacity: 0.55,
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 12, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <MessageCircle size={16} />
              </div>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff' }}>Chat Support</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>Coming Soon</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
import UploadFloorPlan from "../imports/UploadFloorPlan";
import imgBg from "figma:asset/cbb61108720d04d2ff8d142ee51098e6c2f1f1ef.png";
import { Component, type ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("Vite UI crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen w-full bg-[#0b0b0b] text-white flex items-center justify-center p-6">
          <div className="max-w-[900px] w-full rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-[18px] font-semibold">Something crashed in the UI.</div>
            <div className="mt-2 text-[13px] text-white/70">
              Open DevTools Console for the full stack trace.
            </div>
            <pre className="mt-4 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-white/90">
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <div
        className="min-h-screen w-full flex items-start md:items-center justify-center overflow-auto"
        style={{ position: "relative" }}
      >
        {/* ── Background image — fill / cover / center ── */}
        <img
          src={typeof imgBg === "string" ? imgBg : imgBg.src}
          alt=""
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
            zIndex: -2,
            pointerEvents: "none",
          }}
        />
        {/* Dark overlay 37% */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.37)",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />

        <div className="w-full min-h-screen md:w-[1440px] md:h-[813px] md:min-h-0">
          <UploadFloorPlan />
        </div>
      </div>
    </ErrorBoundary>
  );
}
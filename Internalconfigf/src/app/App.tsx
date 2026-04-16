import UploadFloorPlan from "../imports/UploadFloorPlan";
import imgBg from "figma:asset/cbb61108720d04d2ff8d142ee51098e6c2f1f1ef.png";

export default function App() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-auto"
      style={{ position: 'relative' }}
    >
      {/* ── Background image — fill / cover / center ── */}
      <img
        src={typeof imgBg === 'string' ? imgBg : imgBg.src}
        alt=""
        style={{
          position:       'fixed',
          inset:          0,
          width:          '100%',
          height:         '100%',
          objectFit:      'cover',
          objectPosition: 'center',
          display:        'block',
          zIndex:         -2,
          pointerEvents:  'none',
        }}
      />
      {/* Dark overlay 37% */}
      <div
        style={{
          position:      'fixed',
          inset:         0,
          background:    'rgba(0,0,0,0.37)',
          zIndex:        -1,
          pointerEvents: 'none',
        }}
      />

      <div className="w-[1440px] h-[813px]">
        <UploadFloorPlan />
      </div>
    </div>
  );
}
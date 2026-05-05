'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'

const BG_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB0tdM-564nn0QpuYJ_LT_yv4l2ozkuU6n7ellKnp9KeEwT27fCkhpaHA5grS2ozdSO_vY6xSFP0H25RZoGkuomjDOwQbcvnUetdorL6zsSlNPGlDzYUNrleDFx5UeJSXNvvUdufWIdAJTLIchNX_v2zcZwxIpIVIUwHDt-yV9pYX_exXH39GYQNLo3BlBTzpvLBEmPkH7c74oNkVRFVcBLvaWXlmJ8mTbnhZMmZIebqkg0sGNFovFRoyUmXSy_QQ3Kabo3j0fclcuQ'

const AVATARS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCASiK4CkTTkabpRWb-dQKsKK7yLUJjDvsMVs6slv3UzjqL12rqwpUqghWDOiK_pfzi_3n_Xhc9MuHGYYjQ7298twnwixCP95RPb-_n6llF3SVtUsnJMOAg_zvjQO3DN8RmNySiCH6AIlFcoRY_xziof_AS-OI_6RnNzt2i8cI3_57eyAbYETPXV4lBdKBL2KnOFjVQl37wqaKhcPe2jMtXb9Kp7-8VKMEjA7GEqPqDHRQW_cCgn29nCdTpfnpMpEGuMg_qSG6dN5T1',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDler6BU1qtpvdyjxAihP26J8qzI9pXleIxggigH2z5qPmtjh-7tUodLkCGu2CSIGUT5N-VXFqQ2EzID8JaHHHt5p9lLfhLFBCH9eAJ8agNce8sh7P6iUlXmm_Jb85GqsNSFkILQltvyqkC0FVJBZQQyFHiONzJ08ArojwsLIsuLAy6wSx9IOV5B4yk3mxrwbVTHtXqmMF0uY-tNBOrOsmQORf4puaNq6pbpzzDWNgv_4E5XoSaYJEfsqTwmOrnOb_zCDXzGjb_XQNY',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDF0DykZ5uirvDJVe7K7XmHm9C7B379g4xGbBLoAuL2OPowb5Q11CmQ3MMK5blNs1bev0uFL7qr-hfIyWPG4oln_MMJYjdV7rMMS6eRtiblnvkxCyqCf_TRJQLYiYLZCD4mL2KXW9DRqSMr6iKp-gdQWABu2esn7UB7sUymjONuxmDGN_ASCjPDflNynUtiuYtXAuGBvpqxNsElMR_MNH2gcjRJeBtqjMD0H37q8J40EyYYgLB5Aquh8vAzNYqQ1PL3IWtKaNEHEY3A',
]

export default function SpaciaIntroPage() {
  const router = useRouter()

  useEffect(() => {
    try {
      const tok = window.localStorage.getItem('spacia.token')?.trim()
      const otpOk = window.localStorage.getItem('spacia.otpVerified') === '1'
      if (tok || otpOk) router.replace('/auth/continue')
    } catch {
      /* ignore */
    }
  }, [router])

  const goLogin = () => router.push('/login')

  const bgStyle = useMemo(
    () => ({
      backgroundImage: `url("${BG_IMAGE_URL}")`,
    }),
    []
  )

  return (
    <div className="spacia-root" aria-label="Vision intro screen">
      <div className="spacia-bg" style={bgStyle} aria-hidden="true" />
      <div className="spacia-overlay" aria-hidden="true" />
      <div className="spacia-blur" aria-hidden="true" />

      <div className="spacia-shell">
        <div className="spacia-top">
          <div className="spacia-brand" role="banner" aria-label="Vision brand">
            <div className="spacia-mark" aria-hidden="true" />
            <div className="spacia-name">Vision</div>
          </div>
        </div>

        <div className="spacia-content">
          <div className="spacia-label">DESIGN YOUR WORLD</div>

          <h1 className="spacia-title">
            <span>Find Your</span>
            <span>
              <span className="spacia-title-accent">Perfect</span> Space
            </span>
          </h1>

          <p className="spacia-subtitle">
            Join 2M+ homeowners discovering their dream spaces with elite architectural curation.
          </p>

          <div className="spacia-proof" aria-label="Social proof">
            <div className="spacia-avatars" aria-hidden="true">
              {AVATARS.map((src, idx) => (
                <img key={src} src={src} alt="" className="spacia-avatar" style={{ zIndex: 5 - idx }} />
              ))}
            </div>
            <div className="spacia-pill">+2M Users</div>
          </div>
        </div>

        <div className="spacia-bottom">
          <button type="button" className="spacia-skip" onClick={goLogin}>
            Skip
          </button>

          <div className="spacia-dots" aria-label="Pagination">
            <span className="spacia-dot spacia-dot--active" aria-label="Step 1" />
            <span className="spacia-dot" aria-label="Step 2" />
            <span className="spacia-dot" aria-label="Step 3" />
          </div>

          <button type="button" className="spacia-cta" onClick={goLogin} aria-label="Continue to login">
            <span className="spacia-arrow" aria-hidden="true" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .spacia-root {
          position: relative;
          width: 100vw;
          min-height: 100dvh;
          overflow: hidden;
          color: rgba(245, 240, 232, 0.98);
          background: #141313;
        }

        .spacia-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transform: scale(1.04);
          filter: saturate(1.08) contrast(1.02);
        }

        .spacia-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(18, 12, 10, 0.18) 0%,
            rgba(18, 12, 10, 0.42) 45%,
            rgba(18, 12, 10, 0.82) 100%
          );
          mix-blend-mode: multiply;
        }

        .spacia-blur {
          position: absolute;
          inset: 0;
          background: rgba(20, 19, 19, 0.32);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }

        .spacia-shell {
          position: relative;
          z-index: 1;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          padding: max(env(safe-area-inset-top), 16px) 18px max(env(safe-area-inset-bottom), 18px);
          animation: spaciaFadeIn 520ms ease-out both;
        }

        @keyframes spaciaFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .spacia-top {
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding-top: 6px;
        }

        .spacia-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: rgba(245, 240, 232, 0.95);
        }

        .spacia-mark {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          background: radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 1) 0%, rgba(232, 135, 58, 1) 40%, rgba(180, 83, 9, 1) 100%);
          box-shadow: 0 0 22px rgba(232, 135, 58, 0.25);
        }

        .spacia-name {
          font-weight: 700;
          letter-spacing: -0.2px;
          font-size: 22px;
          line-height: 1;
        }

        .spacia-content {
          width: 100%;
          max-width: 420px;
          margin-top: auto;
          margin-bottom: 22px;
        }

        .spacia-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(245, 158, 11, 0.95);
        }

        .spacia-title {
          margin-top: 12px;
          font-size: 52px;
          line-height: 1.04;
          letter-spacing: -0.02em;
          font-weight: 800;
          color: rgba(245, 240, 232, 0.98);
          text-shadow: 0 10px 26px rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .spacia-title-accent {
          color: rgba(245, 158, 11, 0.98);
        }

        .spacia-subtitle {
          margin-top: 14px;
          font-size: 18px;
          line-height: 1.55;
          color: rgba(228, 224, 220, 0.78);
          max-width: 30ch;
        }

        .spacia-proof {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          padding-top: 8px;
        }

        .spacia-avatars {
          display: flex;
          align-items: center;
        }

        .spacia-avatar {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          object-fit: cover;
          border: 2px solid rgba(20, 19, 19, 0.9);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
          margin-left: -10px;
        }
        .spacia-avatar:first-child {
          margin-left: 0;
        }

        .spacia-pill {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: rgba(228, 224, 220, 0.86);
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .spacia-bottom {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 12px 18px max(env(safe-area-inset-bottom), 16px);
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
          z-index: 2;
          background: linear-gradient(180deg, rgba(20, 19, 19, 0) 0%, rgba(20, 19, 19, 0.52) 35%, rgba(20, 19, 19, 0.86) 100%);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .spacia-skip {
          justify-self: start;
          background: transparent;
          border: none;
          color: rgba(228, 224, 220, 0.78);
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          padding: 10px 8px;
          transition: color 160ms ease;
        }
        .spacia-skip:hover {
          color: rgba(245, 240, 232, 0.96);
        }

        .spacia-dots {
          justify-self: center;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .spacia-dot {
          width: 8px;
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.18);
        }
        .spacia-dot--active {
          width: 26px;
          background: rgba(245, 158, 11, 0.92);
        }

        .spacia-cta {
          justify-self: end;
          width: 64px;
          height: 64px;
          border-radius: 999px;
          border: 0;
          cursor: pointer;
          background: rgba(245, 158, 11, 0.98);
          box-shadow: 0 0 26px rgba(232, 135, 58, 0.35);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 160ms ease, filter 160ms ease;
        }
        .spacia-cta:hover {
          transform: scale(1.05);
          filter: brightness(1.02);
        }
        .spacia-cta:active {
          transform: scale(0.98);
        }

        .spacia-arrow {
          width: 16px;
          height: 16px;
          border-right: 3px solid rgba(20, 19, 19, 0.95);
          border-top: 3px solid rgba(20, 19, 19, 0.95);
          transform: rotate(45deg);
          margin-left: -4px;
        }

        @media (min-width: 900px) {
          .spacia-shell {
            padding-left: 28px;
            padding-right: 28px;
          }
          .spacia-content {
            margin-left: auto;
            margin-right: auto;
            text-align: center;
          }
          .spacia-subtitle {
            max-width: none;
            margin-left: auto;
            margin-right: auto;
          }
          .spacia-proof {
            justify-content: center;
          }
          .spacia-bottom {
            max-width: 520px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 20px 20px 0 0;
          }
        }

        @media (max-width: 380px) {
          .spacia-title {
            font-size: 46px;
          }
        }
      `}</style>
    </div>
  )
}


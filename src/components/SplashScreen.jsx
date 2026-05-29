import React, { useEffect, useState } from 'react';
import { getRandomVerse } from '../data/verses';

const SplashScreen = ({ onFinish }) => {
  const [phase, setPhase] = useState('enter');
  // 컴포넌트 마운트 시점에 단 한 번 선택 (재렌더링 시 바뀌지 않음)
  const [verse] = useState(() => getRandomVerse());

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 1400);
    const t2 = setTimeout(() => setPhase('leave'), 2200);
    const t3 = setTimeout(() => onFinish && onFinish(), 2900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen splash-${phase}`}>
      {/* 떠다니는 광점들 (배경) */}
      <div className="splash-orbs">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
        <span className="orb orb-4" />
        <span className="orb orb-5" />
      </div>

      <div className="splash-content">
        {/* 펼쳐진 성경 + 빛 */}
        <div className="splash-book-wrap">
          <div className="splash-halo" />
          <div className="splash-rays">
            <span className="ray ray-1" />
            <span className="ray ray-2" />
            <span className="ray ray-3" />
            <span className="ray ray-4" />
            <span className="ray ray-5" />
          </div>

          <svg
            className="splash-book"
            xmlns="http://www.w3.org/2000/svg"
            width="220"
            height="220"
            viewBox="0 0 512 512"
            fill="none"
          >
            <defs>
              <linearGradient id="splashPageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F1F4FA" />
              </linearGradient>
              <linearGradient id="splashLeftShadow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
              </linearGradient>
              <linearGradient id="splashRightShadow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="splashTextLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#55A88A" />
                <stop offset="100%" stopColor="#7D8CE0" />
              </linearGradient>
              <linearGradient id="splashCrossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#55A88A" />
                <stop offset="50%" stopColor="#6C9BB8" />
                <stop offset="100%" stopColor="#7D8CE0" />
              </linearGradient>
              <radialGradient id="splashWarmHalo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF8DC" stopOpacity="0.9" />
                <stop offset="35%" stopColor="#FFE9A8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FFE9A8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 책 위 따뜻한 빛 후광 */}
            <circle cx="256" cy="200" r="190" fill="url(#splashWarmHalo)" />

            {/* 책 아래 그림자 */}
            <ellipse cx="256" cy="424" rx="150" ry="10" fill="#000000" opacity="0.15" />

            {/* 왼쪽 페이지 */}
            <path
              d="M 110 256 Q 110 248 118 248 L 250 248 Q 254 248 254 252 L 254 412 Q 254 416 250 416 L 118 416 Q 110 416 110 408 Z"
              fill="url(#splashPageGrad)"
            />
            {/* 오른쪽 페이지 */}
            <path
              d="M 402 256 Q 402 248 394 248 L 262 248 Q 258 248 258 252 L 258 412 Q 258 416 262 416 L 394 416 Q 402 416 402 408 Z"
              fill="url(#splashPageGrad)"
            />

            {/* 페이지 안쪽 음영 */}
            <rect x="222" y="248" width="32" height="168" fill="url(#splashLeftShadow)" />
            <rect x="258" y="248" width="32" height="168" fill="url(#splashRightShadow)" />

            {/* 가운데 책등 */}
            <rect x="254" y="248" width="4" height="168" fill="#B8C0CC" opacity="0.7" />

            {/* 텍스트 라인 (왼쪽) */}
            <g opacity="0.32">
              <rect x="138" y="288" width="100" height="3.5" rx="1.5" fill="url(#splashTextLine)" />
              <rect x="138" y="306" width="92"  height="3.5" rx="1.5" fill="url(#splashTextLine)" />
              <rect x="138" y="324" width="100" height="3.5" rx="1.5" fill="url(#splashTextLine)" />
              <rect x="138" y="342" width="84"  height="3.5" rx="1.5" fill="url(#splashTextLine)" />
              <rect x="138" y="360" width="100" height="3.5" rx="1.5" fill="url(#splashTextLine)" />
              <rect x="138" y="378" width="78"  height="3.5" rx="1.5" fill="url(#splashTextLine)" />
            </g>
            {/* 텍스트 라인 (오른쪽) */}
            <g opacity="0.32">
              <rect x="274" y="288" width="100" height="3.5" rx="1.5" fill="url(#splashTextLine)" />
              <rect x="274" y="306" width="92"  height="3.5" rx="1.5" fill="url(#splashTextLine)" />
              <rect x="274" y="324" width="100" height="3.5" rx="1.5" fill="url(#splashTextLine)" />
              <rect x="274" y="342" width="84"  height="3.5" rx="1.5" fill="url(#splashTextLine)" />
              <rect x="274" y="360" width="100" height="3.5" rx="1.5" fill="url(#splashTextLine)" />
              <rect x="274" y="378" width="78"  height="3.5" rx="1.5" fill="url(#splashTextLine)" />
            </g>

            {/* 떠있는 그라디언트 십자가 */}
            <rect x="246" y="142" width="20" height="116" rx="3" fill="url(#splashCrossGrad)" />
            <rect x="216" y="180" width="80" height="20"  rx="3" fill="url(#splashCrossGrad)" />
          </svg>
        </div>

        {/* 제목 */}
        <div className="splash-title-wrap">
          <div className="splash-tag">중구 8 다락방</div>
          <h1 className="splash-title">성경 정독</h1>
          <div className="splash-divider">
            <span />
            <span className="dot" />
            <span />
          </div>
          <p className="splash-verse">{verse.text}</p>
          <p className="splash-ref">{verse.ref}</p>
        </div>

        {/* 로딩 인디케이터 */}
        <div className="splash-loader">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

import React, { useEffect } from 'react';
import { BookOpen, Sparkles, Award, Crown } from 'lucide-react';

const COLORS = ['#55A88A', '#7D8CE0', '#F4D87A', '#D03E3E', '#6C9BB8', '#E0B868', '#A4B1EF'];

const CONFIG = {
  book: {
    icon: BookOpen,
    confettiCount: 28,
    autoClose: 2800,
    big: false,
    getTitle: (data) => `${data.book.name} 완독!`,
    getSubtitle: (data) => `${data.userName}님, ${data.book.chapters}장을 모두 마치셨어요.`,
  },
  ot: {
    icon: Sparkles,
    confettiCount: 60,
    autoClose: null,
    big: true,
    getTitle: () => '구약 39권 완독!',
    getSubtitle: (data) => `${data.userName}님,\n구약 전체를 완주하셨습니다.\n놀라운 여정이에요.`,
  },
  nt: {
    icon: Award,
    confettiCount: 60,
    autoClose: null,
    big: true,
    getTitle: () => '신약 27권 완독!',
    getSubtitle: (data) => `${data.userName}님,\n신약 전체를 완주하셨습니다.\n진심으로 축하드려요.`,
  },
  all: {
    icon: Crown,
    confettiCount: 120,
    autoClose: null,
    big: true,
    getTitle: () => '성경 66권 완독!',
    getSubtitle: (data) =>
      `${data.userName}님,\n마침내 성경 전체를 완독하셨습니다.\n주의 말씀에 거하신 시간,\n진심으로 축하드립니다.`,
  },
};

const Celebration = ({ data, onClose }) => {
  useEffect(() => {
    if (!data) return;
    const cfg = CONFIG[data.type];
    if (cfg && cfg.autoClose) {
      const t = setTimeout(onClose, cfg.autoClose);
      return () => clearTimeout(t);
    }
  }, [data, onClose]);

  if (!data) return null;

  const cfg = CONFIG[data.type];
  const Icon = cfg.icon;

  return (
    <div
      className={`celebration-overlay ${cfg.big ? 'big' : 'small'}`}
      onClick={cfg.autoClose ? undefined : onClose}
    >
      <div className="celebration-confetti" aria-hidden="true">
        {Array.from({ length: cfg.confettiCount }).map((_, i) => {
          const style = {
            left: `${Math.random() * 100}%`,
            backgroundColor: COLORS[i % COLORS.length],
            animationDelay: `${Math.random() * 0.7}s`,
            animationDuration: `${2.4 + Math.random() * 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            width: cfg.big ? `${8 + Math.random() * 6}px` : '8px',
            height: cfg.big ? `${12 + Math.random() * 8}px` : '12px',
          };
          return <span key={i} className="confetti-piece" style={style} />;
        })}
      </div>

      <div
        className={`celebration-card ${data.type === 'all' ? 'celebration-all' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="celebration-icon">
          <Icon size={cfg.big ? 44 : 28} />
        </div>
        <h2 className="celebration-title">{cfg.getTitle(data)}</h2>
        <p className="celebration-subtitle">{cfg.getSubtitle(data)}</p>
        {!cfg.autoClose && (
          <button className="celebration-close" onClick={onClose}>
            확인
          </button>
        )}
      </div>
    </div>
  );
};

export default Celebration;

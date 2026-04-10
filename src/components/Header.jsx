import React, { useState, useEffect } from 'react';
import { BookOpen, Quote } from 'lucide-react';

const verses = [
  { text: "주의 말씀은 내 발에 등이요 내 길에 빛이니이다", ref: "시편 119:105" },
  { text: "하나님의 말씀은 살아 있고 활력이 있어 좌우에 날선 어떤 검보다도 예리하여...", ref: "히브리서 4:12" },
  { text: "모든 성경은 하나님의 감동으로 된 것으로 교훈과 책망과 바르게 함과 의로 교육하기에 유익하니", ref: "디모데후서 3:16" },
  { text: "풀은 마르고 꽃은 시드나 우리 하나님의 말씀은 영원히 서리라 하라", ref: "이사야 40:8" },
  { text: "사람이 떡으로만 살 것이 아니요 하나님의 입으로부터 나오는 모든 말씀으로 살 것이라", ref: "마태복음 4:4" },
  { text: "복 있는 사람은... 오직 여호와의 율법을 즐거워하여 그의 율법을 주야로 묵상하는도다", ref: "시편 1:1-2" },
  { text: "내가 주의 법을 어찌 그리 사랑하는지요 내가 그것을 종일 작은 소리로 읊조리나이다", ref: "시편 119:97" },
  { text: "이 율법책을 네 입에서 떠나지 말게 하며 주야로 그것을 묵상하여 그 안에 기록된 대로 다 지켜 행하라 그리하면 네 길이 평탄하게 될 것이며 네가 형통하리라", ref: "여호수아 1:8" },
  { text: "여호와의 율법은 완전하여 영혼을 소성시키며 여호와의 증거는 확실하여 우둔한 자를 지혜롭게 하며", ref: "시편 19:7" }
];

const Header = () => {
  const [verse, setVerse] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * verses.length);
    setVerse(verses[randomIndex]);
  }, []);

  return (
    <div style={{ marginBottom: '1rem', animation: 'fadeIn 1s ease-out' }}>
      {verse && (
        <div style={{ 
          padding: '0.9rem 1rem', 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)', 
          borderRadius: '12px', 
          border: '1px solid rgba(139, 92, 246, 0.35)', 
          boxShadow: '0 4px 20px -2px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          display: 'block',
          maxWidth: '100%'
        }}>
          <p style={{ 
            fontSize: '1.05rem', 
            color: 'var(--text-primary)', 
            margin: 0,
            fontWeight: '500',
            lineHeight: '1.6',
            wordBreak: 'keep-all',
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            <Quote size={14} style={{ display: 'inline-block', color: 'var(--accent-light)', transform: 'rotate(180deg) translateY(2px)', marginRight: '6px' }} />
            {verse.text}
            <Quote size={14} style={{ display: 'inline-block', color: 'var(--accent-light)', transform: 'translateY(-2px)', marginLeft: '6px', marginRight: '6px' }} />
            <span style={{ display: 'inline-block', color: '#a78bfa', fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap' }}>- {verse.ref}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default Header;

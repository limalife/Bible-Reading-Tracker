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
    <header className="header" style={{ marginBottom: '2rem' }}>
      <h1 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
        <BookOpen size={36} color="#8b5cf6" /> 중구 8 다락방 성경통독 진도표
      </h1>
      
      {verse ? (
        <div style={{ 
          marginTop: '0.5rem', 
          padding: '1.25rem', 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '16px', 
          border: '1px solid var(--glass-border)', 
          display: 'block', 
          margin: '0 auto',
          maxWidth: '800px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          animation: 'fadeIn 1s ease-out'
        }}>
          <p style={{ 
            fontSize: '1.1rem', 
            fontStyle: 'italic', 
            fontWeight: '400', 
            color: 'var(--text-primary)', 
            marginBottom: '0.75rem', 
            lineHeight: '1.6',
            wordBreak: 'keep-all'
          }}>
            <Quote size={16} style={{ display: 'inline-block', marginRight: '0.5rem', color: 'var(--text-secondary)', transform: 'rotate(180deg) translateY(2px)' }} />
            {verse.text}
            <Quote size={16} style={{ display: 'inline-block', marginLeft: '0.5rem', color: 'var(--text-secondary)', transform: 'translateY(-2px)' }} />
          </p>
          <span style={{ fontSize: '0.9rem', color: '#a78bfa', fontWeight: '600', letterSpacing: '0.5px' }}>
            - {verse.ref} -
          </span>
        </div>
      ) : (
        <p>매일 꾸준히 말씀을 읽으며 영적인 성장을 이뤄보세요.</p>
      )}
    </header>
  );
};

export default Header;

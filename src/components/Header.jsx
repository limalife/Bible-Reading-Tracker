import React, { useState, useEffect } from 'react';
import { BookOpen, Quote } from 'lucide-react';

const verses = [
  { text: "주의 말씀은 내 발에 등이요 내 길에 빛이니이다", ref: "시편 119:105" },
  { text: "오직 여호와의 율법을 즐거워하여 그의 율법을 주야로 묵상하는도다", ref: "시편 1:2" },
  { text: "이 율법책을 네 입에서 떠나지 말게 하며 주야로 그것을 묵상하라", ref: "여호수아 1:8" },
  { text: "모든 성경은 하나님의 감동으로 된 것으로... 유익하니", ref: "디모데후서 3:16" },
  { text: "하나님의 말씀은 살아 있고 활력이 있어 좌우에 날선 검보다 예리하여", ref: "히브리서 4:12" },
  { text: "사람이 떡으로만 살 것이 아니요 하나님의 모든 말씀으로 살 것이니라", ref: "마태복음 4:4" },
  { text: "이 예언의 말씀을 읽는 자와 듣는 자와 지키는 자는 복이 있나니", ref: "요한계시록 1:3" },
  { text: "주의 말씀의 맛이 내게 어찌 그리 단지요 내 입에 꿀보다 더 다니이다", ref: "시편 119:103" },
  { text: "여호와의 율법은 완전하여 영혼을 소성시키며 우둔한 자를 지혜롭게 하며", ref: "시편 19:7" },
  { text: "풀은 마르고 꽃은 시드나 우리 하나님의 말씀은 영원히 서리라", ref: "이사야 40:8" },
  { text: "너희가 성경을 상고하거니와 이 성경이 곧 내게 대하여 증언하는 것이니라", ref: "요한복음 5:39" },
  { text: "간절한 마음으로 말씀을 받고 이것이 그러한가 하여 날마다 성경을 상고하므로", ref: "사도행전 17:11" },
  { text: "내가 주의 말씀을 얻어 먹었사오니 주의 말씀은 내 기쁨과 즐거움이오나", ref: "예레미야 15:16" },
  { text: "하나님의 말씀을 듣고 지키는 자가 복이 있느니라", ref: "누가복음 11:28" },
  { text: "하늘과 땅은 없어지겠으나 내 말은 없어지지 아니하리라", ref: "마태복음 24:35" },
  { text: "주의 법이 나의 즐거움이 되지 아니하였더면 내가 고난 중에 멸망하였으리이다", ref: "시편 119:92" },
  { text: "샛별이 너희 마음에 떠오르기까지 너희가 주의 말씀을 주의하는 것이 옳으니라", ref: "베드로후서 1:19" },
  { text: "내 말이 불 같지 아니하냐 바위를 쳐서 부스러뜨리는 방망이 같지 아니하냐", ref: "예레미야 23:29" },
  { text: "너희가 내 말에 거하면 참으로 내 제자가 되고 진리를 알지니", ref: "요한복음 8:31-32" },
  { text: "여호와의 도는 정직하니 의인들은 그 길로 다니리라", ref: "호세아 14:9" }
];

const Header = () => {
  const [verse, setVerse] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * verses.length);
    setVerse(verses[randomIndex]);
  }, []);

  return (
    <div className="header" style={{ marginBottom: '2rem' }}>
      <h1>
        <BookOpen size={24} />
        <span>중구 8 다락방 성경정독</span>
      </h1>
      
      {verse && (
        <div style={{ 
          marginTop: '1.5rem',
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

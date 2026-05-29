import React, { useState, useEffect } from 'react';
import { BookOpen, Quote } from 'lucide-react';
import { getRandomVerse } from '../data/verses';

const Header = () => {
  const [verse, setVerse] = useState(null);

  useEffect(() => {
    setVerse(getRandomVerse());
  }, []);

  return (
    <div className="header" style={{ marginBottom: '2rem' }}>
      <h1>
        <BookOpen size={24} />
        <span>중구 8 다락방 성경정독</span>
      </h1>

      {verse && (
        <div className="verse-card">
          <div className="verse-card-inner">
            <p className="verse-text">
              <Quote
                size={14}
                style={{
                  display: 'inline-block',
                  color: 'var(--accent-color)',
                  transform: 'rotate(180deg) translateY(2px)',
                  marginRight: '6px'
                }}
              />
              {verse.text}
              <Quote
                size={14}
                style={{
                  display: 'inline-block',
                  color: 'var(--accent-color)',
                  transform: 'translateY(-2px)',
                  marginLeft: '6px',
                  marginRight: '6px'
                }}
              />
              <span className="verse-ref">- {verse.ref}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;

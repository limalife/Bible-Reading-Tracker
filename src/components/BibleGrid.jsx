import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

const BibleGrid = ({ books, readChapters, toggleChapter, markBookAsRead }) => {
  const [openBookId, setOpenBookId] = useState(null);

  const handleToggleOpen = (id) => {
    setOpenBookId(openBookId === id ? null : id);
  };

  return (
    <div className="book-grid">
      {books.map(book => {
        const readList = readChapters[book.id] || [];
        const progressPct = Math.round((readList.length / book.chapters) * 100);
        const isOpen = openBookId === book.id;
        const isCompleted = readList.length === book.chapters;

        return (
          <div key={book.id} className="book-card" style={isCompleted ? { borderColor: 'rgba(139, 92, 246, 0.4)' } : {}}>
            <div 
              className="book-info" 
              onClick={() => handleToggleOpen(book.id)}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <span className="book-name">{book.name}</span>
                {isCompleted && <Check size={18} color="#8b5cf6" />}
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <span className="book-progress-text">{readList.length} / {book.chapters}</span>
                {isOpen ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
              </div>
            </div>
            
            <div className="book-progress-bar">
              <div 
                className="book-progress-fill" 
                style={{ width: `${progressPct}%`, background: isCompleted ? '#8b5cf6' : 'var(--accent-color)' }}
              />
            </div>

            {isOpen && (
              <div className="chapter-container">
                <div className="chapter-actions">
                  <button 
                    className="btn-action"
                    onClick={() => markBookAsRead(book.id, book.chapters)}
                  >
                    1~{book.chapters}장 모두 읽음
                  </button>
                </div>
                <div className="chapter-grid">
                  {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => {
                    const isRead = readList.includes(chapter);
                    return (
                      <button
                        key={chapter}
                        className={`chapter-btn ${isRead ? 'read' : ''}`}
                        onClick={() => toggleChapter(book.id, chapter)}
                      >
                        {chapter}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BibleGrid;

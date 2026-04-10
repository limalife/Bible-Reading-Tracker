import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, ChevronUp, Undo2, MousePointerSquareDashed } from 'lucide-react';

const BibleGrid = ({ books, readChapters, toggleChapter, toggleBookProgress, updateBookBatch, autoRouteTarget }) => {
  const [openBookId, setOpenBookId] = useState(null);

  // Drag-to-select states
  const [dragState, setDragState] = useState({
    active: false,
    bookId: null,
    action: null, // 'add' or 'remove'
    startChapter: null,
    currentChapter: null
  });

  const justFinishedDragRef = useRef(false);
  const longPressTimerRef = useRef(null);
  const touchPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const preventScroll = (e) => {
      if (dragState.active) {
        e.preventDefault();
      }
    };
    
    // 비동기적(passive)이 아닌 기본 이벤트 차단 리스너를 문서 최상단에 부착하여 
    // 드래그 모드가 활성화된 상태에서는 화면 스크롤을 원천 봉쇄합니다.
    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => document.removeEventListener('touchmove', preventScroll);
  }, [dragState.active]);

  const handleToggleOpen = (id) => {
    setOpenBookId(openBookId === id ? null : id);
  };

  useEffect(() => {
    if (!autoRouteTarget || !autoRouteTarget.bookId) return;

    const isMyBook = books.some(b => b.id === autoRouteTarget.bookId);
    if (isMyBook) {
      setOpenBookId(autoRouteTarget.bookId);
    } else {
      setOpenBookId(null);
    }
  }, [autoRouteTarget, books]);

  // Drag Handlers
  const handleDragStart = (bookId, chapter, isAlreadyRead) => {
    setDragState({
      active: true,
      bookId,
      action: isAlreadyRead ? 'remove' : 'add',
      startChapter: chapter,
      currentChapter: chapter
    });
  };

  const startLongPress = (e, bookId, chapter, isAlreadyRead) => {
    if (e.pointerType === 'mouse') {
      handleDragStart(bookId, chapter, isAlreadyRead);
    } else {
      touchPosRef.current = { x: e.clientX, y: e.clientY };
      longPressTimerRef.current = setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
        handleDragStart(bookId, chapter, isAlreadyRead);
      }, 300);
    }
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDragEnter = (bookId, chapter) => {
    if (dragState.active && dragState.bookId === bookId && dragState.currentChapter !== chapter) {
      setDragState(prev => ({ ...prev, currentChapter: chapter }));
    }
  };

  const handleTouchMove = (e, bookId) => {
    if (!dragState.active || dragState.bookId !== bookId) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.classList.contains('chapter-btn')) {
      const chapterStr = el.getAttribute('data-chapter');
      if (chapterStr) {
        const chapter = parseInt(chapterStr, 10);
        handleDragEnter(bookId, chapter);
      }
    }
  };

  const handleDragEnd = () => {
    if (dragState.active && dragState.bookId && dragState.startChapter && dragState.currentChapter) {
      const currentList = readChapters[dragState.bookId] || [];
      let nextList = [...currentList];
      
      const start = Math.min(dragState.startChapter, dragState.currentChapter);
      const end = Math.max(dragState.startChapter, dragState.currentChapter);
      
      const draggedArr = [];
      for(let i=start; i<=end; i++) draggedArr.push(i);

      if (dragState.action === 'add') {
         draggedArr.forEach(c => { if (!nextList.includes(c)) nextList.push(c); });
      } else {
         nextList = nextList.filter(c => !draggedArr.includes(c));
      }

      if (draggedArr.length > 0) {
        updateBookBatch(dragState.bookId, nextList);
      }
      
      justFinishedDragRef.current = true;
      setTimeout(() => { justFinishedDragRef.current = false; }, 50);

      setDragState({ active: false, bookId: null, action: null, startChapter: null, currentChapter: null });
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [dragState]);

  return (
    <div className="book-grid">
      {books.map(book => {
        const readList = readChapters[book.id] || [];
        const progressPct = Math.round((readList.length / book.chapters) * 100);
        const isOpen = openBookId === book.id;
        const isCompleted = readList.length === book.chapters;

        return (
          <div 
            key={book.id} 
            id={`book-${book.id}`} 
            className="book-card" 
            style={{ 
              borderColor: isOpen ? 'var(--accent-color)' : (isCompleted ? 'rgba(139, 92, 246, 0.4)' : undefined),
              boxShadow: isOpen ? '0 0 0 1px var(--accent-color), 0 8px 24px rgba(0, 0, 0, 0.25)' : undefined,
              cursor: isOpen ? 'default' : 'pointer'
            }}
            onClick={() => {
              if (!isOpen) handleToggleOpen(book.id);
            }}
          >
            <div 
              className="book-info" 
              onClick={(e) => {
                if (isOpen) {
                  e.stopPropagation();
                  handleToggleOpen(book.id);
                }
              }}
              style={{ cursor: 'pointer' }}
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
              <div 
                className="chapter-container"
                onTouchMove={(e) => handleTouchMove(e, book.id)}
              >
                <div className="chapter-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                  <button 
                    className="btn-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookProgress(book.id, isCompleted, book.chapters);
                    }}
                    style={isCompleted ? { background: 'rgba(255,100,100,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,100,100,0.3)', width: 'auto', flex: 1, whiteSpace: 'nowrap', padding: '0.6rem' } : { width: 'auto', flex: 1, whiteSpace: 'nowrap', padding: '0.6rem' }}
                  >
                    {isCompleted ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Undo2 size={16} /> 모두 취소</span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Check size={16} /> 모두 읽음</span>
                    )}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.6rem 0.8rem', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                    <MousePointerSquareDashed size={14} style={{ marginRight: '6px', color: 'var(--accent-light)' }}/> 꾹 누르고 드래그(다중체크)
                  </div>
                </div>
                <div 
                  className="chapter-grid" 
                  style={{ userSelect: 'none' }} // Prevent text selection while dragging
                >
                  {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => {
                    const isReadOriginally = readList.includes(chapter);
                    // 현재 드래그 중인 상태를 실시간 반영
                    let isRead = isReadOriginally;
                    if (dragState.active && dragState.bookId === book.id && dragState.startChapter && dragState.currentChapter) {
                      const minC = Math.min(dragState.startChapter, dragState.currentChapter);
                      const maxC = Math.max(dragState.startChapter, dragState.currentChapter);
                      if (chapter >= minC && chapter <= maxC) {
                        isRead = (dragState.action === 'add');
                      }
                    }

                    return (
                      <button
                        key={chapter}
                        data-chapter={chapter}
                        className={`chapter-btn ${isRead ? 'read' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (justFinishedDragRef.current) return; // 드래그로 발생한 클릭 이벤트 무시
                          toggleChapter(book.id, chapter); // 키보드 등 순수 클릭 대비
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startLongPress(e, book.id, chapter, isReadOriginally);
                        }}
                        onPointerMove={(e) => {
                          if (e.pointerType !== 'mouse' && !dragState.active && longPressTimerRef.current) {
                            const dx = Math.abs(e.clientX - touchPosRef.current.x);
                            const dy = Math.abs(e.clientY - touchPosRef.current.y);
                            if (dx > 10 || dy > 10) cancelLongPress(); // 스크롤 시도 시 롱프레스 취소
                          }
                          if (dragState.active && e.pointerType === 'mouse') {
                            handleDragEnter(book.id, chapter);
                          }
                        }}
                        onPointerUp={(e) => {
                          cancelLongPress();
                        }}
                        onPointerCancel={(e) => {
                          cancelLongPress();
                        }}
                        // touchAction 속성 제거로 평소 자유로운 세로 스크롤 허용
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

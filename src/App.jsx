import React, { useState, useEffect } from 'react';
import { BookOpen, User } from 'lucide-react';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import BibleGrid from './components/BibleGrid';
import UserTabs, { userList } from './components/UserTabs';
import { oldTestament, newTestament } from './data/bibleData';

// 파이어베이스 모듈 임포트
import { fetchUserProgress, saveUserProgress } from './firebase';

function App() {
  const [activeUser, setActiveUser] = useState(() => {
    const savedUser = localStorage.getItem('lastActiveUser');
    return savedUser && userList.includes(savedUser) ? savedUser : userList[0];
  });
  const [readChapters, setReadChapters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [routeTarget, setRouteTarget] = useState(null);

  // 현재 접속한 탭(사람) 변경 시 로컬 스토리지에 자동 저장
  useEffect(() => {
    localStorage.setItem('lastActiveUser', activeUser);
  }, [activeUser]);

  // 탭 변경 시 파이어베이스에서 해당 유저의 데이터를 읽어옵니다.
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchUserProgress(activeUser);
      if (isMounted) {
        setReadChapters(data);
        
        // 딱 최초 로드 및 탭 변경 시점에 단 한 번만! 스크롤 타겟을 계산합니다.
        // 유저가 클릭해서 체크박스를 바꿀 때는 이 로직이 돌지 않아 화면이 멋대로 움직이지 않습니다.
        const allBooks = [...oldTestament, ...newTestament];
        let targetId = allBooks[0].id;
        let found = false;

        for (let i = allBooks.length - 1; i >= 0; i--) {
          const book = allBooks[i];
          const readCount = data[book.id] ? data[book.id].length : 0;
          if (readCount > 0 && readCount < book.chapters) {
            targetId = book.id;
            found = true;
            break;
          }
        }

        if (!found) {
          let furthestCompletedIdx = -1;
          for (let i = allBooks.length - 1; i >= 0; i--) {
            const book = allBooks[i];
            const readCount = data[book.id] ? data[book.id].length : 0;
            if (readCount === book.chapters) {
              furthestCompletedIdx = i;
              break;
            }
          }
          if (furthestCompletedIdx !== -1) {
            if (furthestCompletedIdx + 1 < allBooks.length) targetId = allBooks[furthestCompletedIdx + 1].id;
            else targetId = allBooks[allBooks.length - 1].id;
          }
        }

        setRouteTarget({ bookId: targetId, triggerTime: Date.now() });
        setIsLoading(false);
      }
    };
    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeUser]);

  // 체크박스 클릭 핸들러 (파이어베이스에도 즉시 저장)
  const toggleChapter = async (bookId, chapter) => {
    const newProgress = { ...readChapters };
    const bookProgress = newProgress[bookId] || [];
    
    if (bookProgress.includes(chapter)) {
      newProgress[bookId] = bookProgress.filter(c => c !== chapter);
    } else {
      newProgress[bookId] = [...bookProgress, chapter].sort((a, b) => a - b);
    }
    
    // UI 즉각 반영
    setReadChapters(newProgress);
    // 파이어베이스 업로드
    await saveUserProgress(activeUser, newProgress);
  };

  const toggleBookProgress = async (bookId, isCompleted, totalChapters) => {
    const newProgress = {
      ...readChapters,
      [bookId]: isCompleted ? [] : Array.from({ length: totalChapters }, (_, i) => i + 1)
    };
    setReadChapters(newProgress);
    await saveUserProgress(activeUser, newProgress);
  };

  // 드래그를 마치고 손을 뗐을 때 1번만 DB에 저장하기 위한 함수
  const updateBookBatch = async (bookId, newChaptersArr) => {
    const newProgress = {
      ...readChapters,
      [bookId]: [...newChaptersArr].sort((a,b)=>a-b)
    };
    setReadChapters(newProgress);
    await saveUserProgress(activeUser, newProgress);
  };

  const calculateProgress = (books) => {
    let totalChapters = 0;
    let readCount = 0;

    books.forEach(book => {
      totalChapters += book.chapters;
      if (readChapters[book.id]) {
        readCount += readChapters[book.id].length;
      }
    });

    return {
      total: totalChapters,
      read: readCount,
      percentage: totalChapters === 0 ? 0 : Math.round((readCount / totalChapters) * 1000) / 10
    };
  };

  const otStats = calculateProgress(oldTestament);
  const ntStats = calculateProgress(newTestament);
  const totalStats = {
    total: otStats.total + ntStats.total,
    read: otStats.read + ntStats.read,
    percentage: Math.round(((otStats.read + ntStats.read) / (otStats.total + ntStats.total)) * 1000) / 10
  };

  const handleJumpToReading = () => {
    if (routeTarget && routeTarget.bookId) {
      const target = document.getElementById(`book-${routeTarget.bookId}`);
      if (target) {
        const y = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="app-container">
      <Header />
      
      {/* 12인 탭 컴포넌트 */}
      <h2 style={{ fontSize: '1.2rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
        <User size={18} /> 누구의 진도표를 볼까요?
      </h2>
      <UserTabs activeUser={activeUser} onTabChange={setActiveUser} />

      <div className="progress-section" style={{ position: 'relative' }}>
        {isLoading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
            <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>불러오는 중...</span>
          </div>
        )}
        <h2 className="section-title">
          <span style={{ color: 'var(--accent-hover)' }}>{activeUser}</span>님의 통독 현황 
        </h2>
        <ProgressBar title="성경 전체" stats={totalStats} />
        <ProgressBar title="구약" stats={otStats} />
        <ProgressBar title="신약" stats={ntStats} />
      </div>

      {!isLoading && (
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <button 
            onClick={handleJumpToReading} 
            className="btn-action" 
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent-color) 100%)', 
              color: 'white', 
              padding: '0.85rem 2rem', 
              fontSize: '1.05rem', 
              fontWeight: '600',
              borderRadius: '50px', 
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              border: 'none',
              transform: 'translateY(-10px)',
              letterSpacing: '0.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              margin: '0 auto'
            }}
          >
            <BookOpen size={20} /> 읽던 곳으로 바로 내려가기
          </button>
        </div>
      )}

      <div style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
        <h2 className="section-title"><BookOpen size={24} /> 구약 (Old Testament)</h2>
        <BibleGrid 
          books={oldTestament} 
          readChapters={readChapters} 
          toggleChapter={toggleChapter}
          toggleBookProgress={toggleBookProgress}
          updateBookBatch={updateBookBatch}
          autoRouteTarget={routeTarget}
        />

        <h2 className="section-title" style={{ marginTop: '3rem' }}><BookOpen size={24} /> 신약 (New Testament)</h2>
        <BibleGrid 
          books={newTestament} 
          readChapters={readChapters} 
          toggleChapter={toggleChapter}
          toggleBookProgress={toggleBookProgress}
          updateBookBatch={updateBookBatch}
          autoRouteTarget={routeTarget}
        />
      </div>
    </div>
  );
}

export default App;

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

  const markBookAsRead = async (bookId, totalChapters) => {
    const newProgress = {
      ...readChapters,
      [bookId]: Array.from({ length: totalChapters }, (_, i) => i + 1)
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

      <div style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
        <h2 className="section-title"><BookOpen size={24} /> 구약 (Old Testament)</h2>
        <BibleGrid 
          books={oldTestament} 
          readChapters={readChapters} 
          toggleChapter={toggleChapter}
          markBookAsRead={markBookAsRead}
        />

        <h2 className="section-title" style={{ marginTop: '3rem' }}><BookOpen size={24} /> 신약 (New Testament)</h2>
        <BibleGrid 
          books={newTestament} 
          readChapters={readChapters} 
          toggleChapter={toggleChapter}
          markBookAsRead={markBookAsRead}
        />
      </div>
    </div>
  );
}

export default App;

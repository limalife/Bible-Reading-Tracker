import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Users, TrendingUp } from 'lucide-react';
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
  
  // 전체 화면용 state
  const [allUsersData, setAllUsersData] = useState([]);
  const [isAllUsersLoading, setIsAllUsersLoading] = useState(false);

  // 현재 접속한 탭(사람) 변경 시 파이어베이스에서 해당 데이터를 읽어옵니다.
  useEffect(() => {
    let isMounted = true;

    if (activeUser === '전체') {
      const loadAll = async () => {
        setIsAllUsersLoading(true);
        const allBooks = [...oldTestament, ...newTestament];
        const totalBibleChapters = allBooks.reduce((acc, b) => acc + b.chapters, 0);
        
        try {
          const promises = userList.map(name => fetchUserProgress(name).then(res => ({ name, data: res.chapters })));
          const fetchedData = await Promise.all(promises);
          
          if (isMounted) {
            const stats = fetchedData.map(({ name, data }) => {
              let readCount = 0;
              let currentPos = '-';
              let furthestBookIdx = -1;
              let furthestChapter = 0;

              allBooks.forEach((book, idx) => {
                if (data[book.id] && data[book.id].length > 0) {
                  readCount += data[book.id].length;
                  if (idx > furthestBookIdx) {
                    furthestBookIdx = idx;
                    furthestChapter = Math.max(...data[book.id]);
                  }
                }
              });

              if (furthestBookIdx !== -1) {
                currentPos = `${allBooks[furthestBookIdx].name} ${furthestChapter}장`;
              }
              
              const percentage = ((readCount / totalBibleChapters) * 100).toFixed(2);
              const remaining = totalBibleChapters - readCount;

              return { name, readCount, percentage, remaining, currentPos };
            });

            // 원본 스와이프(userList) 순서 유지
            setAllUsersData(stats);
          }
        } catch(e) {
          console.error(e);
        } finally {
          if (isMounted) setIsAllUsersLoading(false);
        }
      };
      loadAll();
      return () => { isMounted = false; };
    }

    // 개별 유저 조회
    const loadData = async () => {
      setIsLoading(true);
      const { chapters: data, lastChecked } = await fetchUserProgress(activeUser);
      if (isMounted) {
        setReadChapters(data);
        
        // 딱 최초 로드 및 탭 변경 시점에 단 한 번만! 스크롤 타겟을 계산합니다.
        // 유저가 클릭해서 체크박스를 바꿀 때는 이 로직이 돌지 않아 화면이 멋대로 움직이지 않습니다.
        const allBooks = [...oldTestament, ...newTestament];
        let targetId = null;
        let targetChapter = null;

        if (lastChecked && lastChecked.bookId) {
          targetId = lastChecked.bookId;
          targetChapter = lastChecked.chapter;
        }

        if (!targetId) {
          targetId = allBooks[0].id;
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
        }

        setRouteTarget({ bookId: targetId, chapter: targetChapter, triggerTime: Date.now() });
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
    let isAdding = false;
    
    if (bookProgress.includes(chapter)) {
      newProgress[bookId] = bookProgress.filter(c => c !== chapter);
    } else {
      newProgress[bookId] = [...bookProgress, chapter].sort((a, b) => a - b);
      isAdding = true;
    }
    
    // UI 즉각 반영
    setReadChapters(newProgress);
    
    const lastChecked = isAdding ? { bookId, chapter } : undefined;
    
    // 파이어베이스 업로드
    await saveUserProgress(activeUser, newProgress, lastChecked);
    
    // 새로 체크한 경우 읽던 곳 타겟을 즉시 갱신
    if (isAdding) {
      setRouteTarget(prev => ({ ...prev, bookId, chapter }));
    }
  };

  const toggleBookProgress = async (bookId, isCompleted, totalChapters) => {
    const newProgress = {
      ...readChapters,
      [bookId]: isCompleted ? [] : Array.from({ length: totalChapters }, (_, i) => i + 1)
    };
    setReadChapters(newProgress);
    
    const lastChecked = !isCompleted ? { bookId, chapter: totalChapters } : undefined;
    
    await saveUserProgress(activeUser, newProgress, lastChecked);
    
    // 새로 모두 읽음을 체크한 경우 읽던 곳 타겟 갱신
    if (!isCompleted) {
      setRouteTarget(prev => ({ ...prev, bookId, chapter: totalChapters }));
    }
  };

  // 드래그를 마치고 손을 뗐을 때 1번만 DB에 저장하기 위한 함수
  const updateBookBatch = async (bookId, newChaptersArr, addedChaptersArr = []) => {
    const newProgress = {
      ...readChapters,
      [bookId]: [...newChaptersArr].sort((a,b)=>a-b)
    };
    setReadChapters(newProgress);
    
    let lastChecked;
    if (addedChaptersArr && addedChaptersArr.length > 0) {
       lastChecked = { bookId, chapter: Math.max(...addedChaptersArr) };
    }
    await saveUserProgress(activeUser, newProgress, lastChecked);

    // 새로 드래그로 체크한 경우 읽던 곳 타겟 갱신
    if (lastChecked) {
      setRouteTarget(prev => ({ ...prev, bookId: lastChecked.bookId, chapter: lastChecked.chapter }));
    }
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
  // 로컬 스토리지 저장 (전체 탭 제외)
  useEffect(() => {
    if (activeUser !== '전체') {
      localStorage.setItem('lastActiveUser', activeUser);
    }
  }, [activeUser]);

  const handleJumpToReading = () => {
    if (routeTarget && routeTarget.bookId) {
      // 트리거 타임을 업데이트하여 BibleGrid가 닫힌 패널을 강제로 다시 열도록 유도합니다.
      setRouteTarget({ ...routeTarget, triggerTime: Date.now() });
      
      // 패널이 열리고 레이아웃이 계산될 시간을 확보하기 위해 Timeout 값을 조금 여유롭게(100ms) 줍니다.
      setTimeout(() => {
        const target = document.getElementById(`book-${routeTarget.bookId}`);
        if (target) {
          // 패널 최상단 위쪽으로 여유 공간(80px)을 두어 이름이 잘리지 않도록 합니다.
          const y = target.getBoundingClientRect().top + window.scrollY - 80;
          
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleDownloadExcel = () => {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const header = ['이름', '읽은 장 수', '달성률(%)', '남은 진도(장)', '현재 위치'];
      const csvContent = [
        header.join(','),
        ...allUsersData.map(u => `${u.name},${u.readCount},${u.percentage}%,${u.remaining},${u.currentPos}`)
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `다락방_전체_현황_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch(e) {
      alert("다운로드 실패");
    }
  };

  return (
    <div className="app-container">
      <Header />

      {/* 12인 탭 컴포넌트 */}
      <div style={{ marginTop: '1rem', marginBottom: '1.5rem', opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
        <UserTabs activeUser={activeUser} onTabChange={setActiveUser} />
      </div>

      <div className="progress-section" style={{ position: 'relative' }}>
        {(isLoading || isAllUsersLoading) && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
            <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>불러오는 중...</span>
          </div>
        )}

        {activeUser === '전체' ? (
          <div>
            <h2 className="section-title">
              <Users size={24} color="#8b5cf6" /> 다락방 전체 현황 
            </h2>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {allUsersData.map((user) => (
                <div key={user.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '1.05rem' }}>{user.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.readCount}장</span>
                    <span style={{ color: 'var(--accent-light)', fontWeight: '700', fontSize: '1.05rem', minWidth: '3.8rem', textAlign: 'right' }}>{user.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'right', marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <button 
                onClick={handleDownloadExcel}
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 8px rgba(139, 92, 246, 0.1)'
                }}
              >
                <Download size={16} /> 전체 현황 엑셀 다운로드 (CSV)
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="section-title" style={{ display: 'block', wordBreak: 'keep-all', lineHeight: '1.4' }}>
              <span style={{ color: 'var(--accent-hover)', whiteSpace: 'nowrap' }}>{activeUser}</span>님의 성경 정독 현황 
            </h2>
            <ProgressBar title="성경 전체" stats={{
              total: oldTestament.reduce((acc,b)=>acc+b.chapters,0) + newTestament.reduce((acc,b)=>acc+b.chapters,0),
              read: Object.values(readChapters).reduce((acc, arr) => acc + arr.length, 0),
              percentage: Math.round(((Object.values(readChapters).reduce((acc, arr) => acc + arr.length, 0)) / (oldTestament.reduce((acc,b)=>acc+b.chapters,0) + newTestament.reduce((acc,b)=>acc+b.chapters,0))) * 1000) / 10
            }} />
            <ProgressBar title="구약" stats={{
              total: oldTestament.reduce((acc,b)=>acc+b.chapters,0),
              read: oldTestament.reduce((acc, book) => acc + (readChapters[book.id] ? readChapters[book.id].length : 0), 0),
              percentage: oldTestament.reduce((acc,b)=>acc+b.chapters,0) === 0 ? 0 : Math.round((oldTestament.reduce((acc, book) => acc + (readChapters[book.id] ? readChapters[book.id].length : 0), 0) / oldTestament.reduce((acc,b)=>acc+b.chapters,0)) * 1000) / 10
            }} />
            <ProgressBar title="신약" stats={{
              total: newTestament.reduce((acc,b)=>acc+b.chapters,0),
              read: newTestament.reduce((acc, book) => acc + (readChapters[book.id] ? readChapters[book.id].length : 0), 0),
              percentage: newTestament.reduce((acc,b)=>acc+b.chapters,0) === 0 ? 0 : Math.round((newTestament.reduce((acc, book) => acc + (readChapters[book.id] ? readChapters[book.id].length : 0), 0) / newTestament.reduce((acc,b)=>acc+b.chapters,0)) * 1000) / 10
            }} />
          </div>
        )}
      </div>

      {activeUser !== '전체' && !isLoading && (
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <button 
            onClick={handleJumpToReading} 
            className="jump-btn"
          >
            <BookOpen size={20} /> 읽던 곳으로 바로 내려가기
          </button>
        </div>
      )}

      {activeUser !== '전체' && (
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
      )}
    </div>
  );
}

export default App;

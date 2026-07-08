import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Users, Share2, Calendar, Flag } from 'lucide-react';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import BibleGrid from './components/BibleGrid';
import UserTabs, { userList } from './components/UserTabs';
import SplashScreen from './components/SplashScreen';
import Celebration from './components/Celebration';
import { oldTestament, newTestament } from './data/bibleData';

// 파이어베이스 모듈 임포트
import { fetchUserProgress, saveUserProgress } from './firebase';

// 네이티브(안드로이드/iOS) 파일 저장·공유용 Capacitor 플러그인
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function App() {
  const [activeUser, setActiveUser] = useState(() => {
    const savedUser = localStorage.getItem('lastActiveUser');
    return savedUser && userList.includes(savedUser) ? savedUser : userList[0];
  });
  const [readChapters, setReadChapters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [routeTarget, setRouteTarget] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [celebration, setCelebration] = useState(null);
  const [shareImage, setShareImage] = useState(null); // 이미지 미리보기/저장 오버레이용 data URL
  const prevReadRef = useRef(null);
  
  // 전체 화면용 state
  const [allUsersData, setAllUsersData] = useState([]);
  const [isAllUsersLoading, setIsAllUsersLoading] = useState(false);

  // 사용자 변경 시 비교 기준 리셋 (다른 사람 데이터로 바뀔 때 축하 트리거 방지)
  useEffect(() => {
    prevReadRef.current = null;
  }, [activeUser]);

  // 완독 감지 — readChapters 변화를 prev와 비교하여 새로 완성된 책/구약/신약/전체 판정
  useEffect(() => {
    if (activeUser === '전체') return;

    const prev = prevReadRef.current;
    const next = readChapters;

    // 기준선(prev)이 아직 없으면 트리거하지 않음.
    // 기준선은 파이어베이스 로드 완료 시점(loadData)에서 설정한다.
    // (초기 빈 {} 상태를 기준선으로 삼으면 새로고침마다 완독 책이 전부 "신규 완독"으로 잡혀 축하가 뜸)
    if (prev === null) return;

    const allBooks = [...oldTestament, ...newTestament];
    const isDone = (data, b) => (data[b.id]?.length || 0) === b.chapters;

    const newlyCompleted = allBooks.filter(b => !isDone(prev, b) && isDone(next, b));

    prevReadRef.current = next;

    if (newlyCompleted.length === 0) return;

    const isOTDone = oldTestament.every(b => isDone(next, b));
    const isNTDone = newTestament.every(b => isDone(next, b));
    const wasOTDone = oldTestament.every(b => isDone(prev, b));
    const wasNTDone = newTestament.every(b => isDone(prev, b));

    let cel;
    if (isOTDone && isNTDone && !(wasOTDone && wasNTDone)) {
      cel = { type: 'all' };
    } else if (isOTDone && !wasOTDone) {
      cel = { type: 'ot' };
    } else if (isNTDone && !wasNTDone) {
      cel = { type: 'nt' };
    } else {
      cel = { type: 'book', book: newlyCompleted[newlyCompleted.length - 1] };
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const pattern = cel.type === 'all'
        ? [80, 50, 80, 50, 120]
        : cel.type === 'book'
        ? 25
        : [50, 40, 50];
      navigator.vibrate(pattern);
    }

    setCelebration({ ...cel, userName: activeUser });
  }, [readChapters, activeUser]);

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
        // 로드된 데이터를 완독 감지의 기준선으로 설정 (로드 자체로는 축하가 뜨지 않도록)
        prevReadRef.current = data;

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

  // 성경정독 계획(6월 28일 시작, 매일 20장)에 따른 "오늘까지 목표" 계산.
  // 전체 현황 화면과 CSV 다운로드가 함께 사용한다.
  const planInfo = (() => {
    const now = new Date();
    const CHAPTERS_PER_DAY = 20;
    const startDate = new Date(now.getFullYear(), 5, 28); // 5 = 6월
    if (startDate > now) {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysElapsed = Math.floor((todayMidnight - startMidnight) / 86400000) + 1;

    const allBooks = [...oldTestament, ...newTestament];
    const totalBibleChapters = allBooks.reduce((acc, b) => acc + b.chapters, 0);
    const targetChapters = Math.min(daysElapsed * CHAPTERS_PER_DAY, totalBibleChapters);

    let targetPos = '-';
    let acc = 0;
    for (const book of allBooks) {
      if (acc + book.chapters >= targetChapters) {
        targetPos = `${book.name} ${targetChapters - acc}장`;
        break;
      }
      acc += book.chapters;
    }

    const todayLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    // 파일명용 로컬 날짜 (toISOString은 UTC라 한국 오전에 전날로 나오는 문제 방지)
    const pad2 = (n) => String(n).padStart(2, '0');
    const fileDate = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

    return { daysElapsed, targetChapters, targetPos, todayLabel, fileDate };
  })();

  // 오늘까지 목표 대비 진도율(%) — 100% 이상이면 진도보다 앞섬
  const getPace = (readCount) =>
    planInfo.targetChapters === 0 ? 0 : Math.round((readCount / planInfo.targetChapters) * 1000) / 10;
  // 로컬 스토리지 저장 (전체 탭 제외)
  useEffect(() => {
    if (activeUser !== '전체') {
      localStorage.setItem('lastActiveUser', activeUser);
    }
  }, [activeUser]);

  const handleJumpToReading = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
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

  // 전체 현황 표를 Canvas로 그려 이미지(PNG)로 만든다.
  const buildStatsCanvas = () => {
    const { targetPos, targetChapters, todayLabel, daysElapsed } = planInfo;

    const cols = [
      { key: 'name', label: '이름', w: 84, align: 'left' },
      { key: 'pos', label: '현재 위치', w: 150, align: 'left' },
      { key: 'read', label: '읽은 장수', w: 76, align: 'center' },
      { key: 'pace', label: '진도율', w: 82, align: 'center' },
      { key: 'total', label: '전체 진도', w: 96, align: 'center' },
    ];
    const M = 16;              // 바깥 여백
    const titleH = 38, headH = 32, rowH = 30;
    const tableW = cols.reduce((a, c) => a + c.w, 0);
    const W = tableW + M * 2;
    const H = M * 2 + titleH * 2 + headH + rowH * allUsersData.length;

    const scale = 2;           // 고해상도(레티나)용
    const canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.textBaseline = 'middle';
    const font = (px, bold) => `${bold ? 'bold ' : ''}${px}px "맑은 고딕","Malgun Gothic",-apple-system,sans-serif`;

    // 배경
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const x0 = M;
    let y = M;

    // 제목 2줄 (연파랑 배경, 가운데 정렬)
    const titles = [`${todayLabel} (D+${daysElapsed}일)`, `오늘까지 목표: ${targetPos} (${targetChapters}장)`];
    ctx.textAlign = 'center';
    titles.forEach((t) => {
      ctx.fillStyle = '#dce6f1';
      ctx.fillRect(x0, y, tableW, titleH);
      ctx.strokeStyle = '#b0b0b0';
      ctx.strokeRect(x0, y, tableW, titleH);
      ctx.fillStyle = '#1f3b57';
      ctx.font = font(16, true);
      ctx.fillText(t, x0 + tableW / 2, y + titleH / 2 + 1);
      y += titleH;
    });

    // 헤더 줄 (회색)
    let cx = x0;
    ctx.font = font(13, true);
    cols.forEach((c) => {
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(cx, y, c.w, headH);
      ctx.strokeStyle = '#b0b0b0';
      ctx.strokeRect(cx, y, c.w, headH);
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, cx + c.w / 2, y + headH / 2 + 1);
      cx += c.w;
    });
    y += headH;

    // 데이터 줄
    ctx.font = font(13, false);
    allUsersData.forEach((u) => {
      const pace = getPace(u.readCount);
      const vals = {
        name: u.name,
        pos: u.currentPos,
        read: String(u.readCount),
        pace: `${pace}%`,
        total: `${u.percentage}%`,
      };
      let dx = x0;
      cols.forEach((c) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dx, y, c.w, rowH);
        ctx.strokeStyle = '#dcdcdc';
        ctx.strokeRect(dx, y, c.w, rowH);
        ctx.fillStyle = c.key === 'pace' ? (pace >= 100 ? '#2e8b57' : '#d9822b') : '#222222';
        ctx.textAlign = c.align;
        const tx = c.align === 'left' ? dx + 8 : dx + c.w / 2;
        ctx.fillText(vals[c.key], tx, y + rowH / 2 + 1);
        dx += c.w;
      });
      y += rowH;
    });

    return canvas;
  };

  const handleShareImage = async () => {
    try {
      const canvas = buildStatsCanvas();
      const fileName = `다락방_전체_현황_${planInfo.fileDate}.png`;

      if (Capacitor.isNativePlatform()) {
        // 설치한 앱에서만: Filesystem 저장 후 네이티브 공유 시트
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        const { uri } = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        });
        await Share.share({
          title: '다락방 전체 현황',
          dialogTitle: '전체 현황 이미지 공유',
          files: [uri],
        });
      } else {
        // 웹(PC 브라우저·카톡 인앱 브라우저 포함): 미리보기를 띄우고 저장 버튼 제공
        setShareImage(canvas.toDataURL('image/png'));
      }
    } catch(e) {
      if (e && (e.message === 'Share canceled' || e.message === 'Share cancelled')) return;
      alert("이미지 공유 실패");
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <Celebration data={celebration} onClose={() => setCelebration(null)} />

      {/* 이미지 미리보기 + 저장 (PC·카톡 인앱 브라우저 공통) */}
      {shareImage && (
        <div
          onClick={() => setShareImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.2rem' }}
        >
          <p style={{ color: '#fff', fontSize: '0.9rem', textAlign: 'center', margin: 0, wordBreak: 'keep-all' }}>
            아래 <b>저장</b> 버튼을 눌러 이미지를 저장하세요
          </p>
          <img
            src={shareImage}
            alt="다락방 전체 현황"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
          />
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <a
              href={shareImage}
              download={`다락방_전체_현황_${planInfo.fileDate}.png`}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--accent-color)', color: '#fff', textDecoration: 'none', padding: '0.6rem 1.6rem', borderRadius: '99px', fontSize: '0.9rem', fontWeight: '700' }}
            >
              저장
            </a>
            <button
              onClick={() => setShareImage(null)}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '99px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    <div className="app-container">
      <Header />

      {/* 12인 탭 컴포넌트 */}
      <div style={{ marginTop: '1rem', marginBottom: '1.5rem', opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
        <UserTabs activeUser={activeUser} onTabChange={setActiveUser} />
      </div>

      <div className="progress-section" style={{ position: 'relative' }}>
        {(isLoading || isAllUsersLoading) && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(4px)', borderRadius: 'var(--border-radius)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
            <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>불러오는 중...</span>
          </div>
        )}

        {activeUser === '전체' ? (
          <div>
            <h2 className="section-title">
              <Users size={24} color="var(--accent-color)" /> 다락방 전체 현황
            </h2>

            {/* 오늘 날짜 + 오늘까지 목표 위치 (간소화 배너) */}
            <div style={{ marginTop: '1rem', padding: '0.55rem 0.9rem', background: 'var(--accent-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.83rem', fontWeight: '700', color: 'var(--accent-hover)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} /> {planInfo.todayLabel} <span style={{ opacity: 0.7, fontWeight: 600 }}>(D+{planInfo.daysElapsed})</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Flag size={14} /> 목표 {planInfo.targetPos}
              </span>
            </div>

            <div style={{ marginTop: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {allUsersData.map((user) => {
                const pace = getPace(user.readCount);
                const ahead = pace >= 100;
                return (
                <div key={user.name} style={{ padding: '0.9rem 1rem', background: 'var(--bg-color)', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.04)' }}>
                  {/* 1줄: 이름 + 전체 달성률 */}
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.05rem' }}>{user.name}</span>
                    <span style={{ color: 'var(--accent-color)', fontWeight: '800', fontSize: '1.15rem' }}>{user.percentage}%</span>
                  </div>
                  {/* 2줄: 현재 위치 + 진도 배지 + 읽은 장수 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.45rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📖 {user.currentPos}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        whiteSpace: 'nowrap',
                        color: ahead ? '#2e8b57' : '#d9822b',
                        background: ahead ? 'rgba(46,139,87,0.12)' : 'rgba(217,130,43,0.12)',
                      }}>
                        진도 {pace}%
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{user.readCount}장</span>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'right', marginTop: '2rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem' }}>
              <button
                onClick={handleShareImage}
                style={{
                  background: 'var(--accent-color)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.7rem 1.4rem',
                  borderRadius: '99px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(107, 142, 123, 0.25)'
                }}
              >
                <Share2 size={16} /> 이미지로 공유
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
            <div className="ot-theme">
              <ProgressBar title="구약" stats={{
                total: oldTestament.reduce((acc,b)=>acc+b.chapters,0),
                read: oldTestament.reduce((acc, book) => acc + (readChapters[book.id] ? readChapters[book.id].length : 0), 0),
                percentage: oldTestament.reduce((acc,b)=>acc+b.chapters,0) === 0 ? 0 : Math.round((oldTestament.reduce((acc, book) => acc + (readChapters[book.id] ? readChapters[book.id].length : 0), 0) / oldTestament.reduce((acc,b)=>acc+b.chapters,0)) * 1000) / 10
              }} />
            </div>
            <div className="nt-theme">
              <ProgressBar title="신약" stats={{
                total: newTestament.reduce((acc,b)=>acc+b.chapters,0),
                read: newTestament.reduce((acc, book) => acc + (readChapters[book.id] ? readChapters[book.id].length : 0), 0),
                percentage: newTestament.reduce((acc,b)=>acc+b.chapters,0) === 0 ? 0 : Math.round((newTestament.reduce((acc, book) => acc + (readChapters[book.id] ? readChapters[book.id].length : 0), 0) / newTestament.reduce((acc,b)=>acc+b.chapters,0)) * 1000) / 10
              }} />
            </div>
          </div>
        )}
      </div>

      {activeUser !== '전체' && !isLoading && (
        <button
          onClick={handleJumpToReading}
          className="jump-fab"
          aria-label="읽던 말씀으로 가기"
        >
          <BookOpen size={20} />
          <span className="jump-fab-label">읽던 말씀으로 가기</span>
        </button>
      )}

      {activeUser !== '전체' && (
        <div style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
          <div className="ot-theme">
            <h2 className="section-title"><BookOpen size={24} /> 구약 (Old Testament)</h2>
            <BibleGrid
              books={oldTestament}
              readChapters={readChapters}
              toggleChapter={toggleChapter}
              toggleBookProgress={toggleBookProgress}
              updateBookBatch={updateBookBatch}
              autoRouteTarget={routeTarget}
            />
          </div>

          <div className="nt-theme" style={{ marginTop: '3rem' }}>
            <h2 className="section-title"><BookOpen size={24} /> 신약 (New Testament)</h2>
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
      )}
    </div>
    </>
  );
}

export default App;

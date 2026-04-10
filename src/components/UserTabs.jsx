import React, { useRef, useEffect } from 'react';

const users = [
  "조용수", "김지윤", "강준원", "이은지", 
  "나현우", "강수민", "이재선", "오혜림", 
  "양정훈", "이진선", "안승민", "한수연"
];

const UserTabs = ({ activeUser, onTabChange }) => {
  const scrollRef = useRef(null);

  // 최초 진입 시, 선택된 사용자의 탭이 가로 스크롤 정중앙에 오도록 자동 이동
  useEffect(() => {
    if (scrollRef.current) {
      const activeBtn = scrollRef.current.querySelector('.user-tab-btn.active');
      if (activeBtn) {
        scrollRef.current.scrollLeft = activeBtn.offsetLeft - (scrollRef.current.offsetWidth / 2) + (activeBtn.offsetWidth / 2);
      }
    }
  }, []);

  // 마우스 스크롤(드래그) 지원 로직 (가로 스크롤을 더욱 편하게)
  let isDown = false;
  let startX;
  let scrollLeft;

  const handleMouseDown = (e) => {
    isDown = true;
    startX = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown = false;
  };

  const handleMouseUp = () => {
    isDown = false;
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 스크롤 속도
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="user-tabs-container">
      <div 
        className="user-tabs"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {users.map(name => (
          <button
            key={name}
            className={`user-tab-btn ${activeUser === name ? 'active' : ''}`}
            onClick={() => onTabChange(name)}
          >
            {name}
          </button>
        ))}
        <button
          className={`user-tab-btn ${activeUser === '전체' ? 'active' : ''}`}
          onClick={() => onTabChange('전체')}
        >
          전체
        </button>
      </div>
    </div>
  );
};

export const userList = users;
export default UserTabs;

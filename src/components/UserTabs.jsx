import React, { useRef, useEffect } from 'react';
import { Users } from 'lucide-react';

const users = [
  "조용수", "김지윤", "조나단", "강준원", "이은지", "강서현",
  "나현우", "강수민", "나도윤", "이재선", "오혜림", "이하진", "이하린",
  "양정훈", "이진선", "양하준", "안승민", "한수연"
];

const UserTabs = ({ activeUser, onTabChange }) => {
  const scrollRef = useRef(null);

  // 최초 진입 시, 선택된 사용자의 탭이 가로 스크롤 정중앙에 오도록 자동 이동.
  // '전체' 버튼이 스크롤 영역 밖으로 나가 있어 offsetLeft 기준은 어긋나므로
  // 컨테이너 대비 실제 위치(getBoundingClientRect)로 계산해 이름이 가려지지 않게 한다.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeBtn = container.querySelector('.user-tab-btn.active');
    if (!activeBtn) return; // '전체' 선택 시엔 스크롤 영역 안에 active가 없음
    const cRect = container.getBoundingClientRect();
    const bRect = activeBtn.getBoundingClientRect();
    const delta = (bRect.left - cRect.left) - container.clientWidth / 2 + bRect.width / 2;
    container.scrollLeft += delta; // 음수면 브라우저가 0으로 clamp → 앞쪽 이름도 정상 노출
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
      {/* 개인 목록 스크롤과 분리해 맨 앞에 항상 보이는 '전체' 버튼 */}
      <button
        className={`user-tab-btn user-tab-all ${activeUser === '전체' ? 'active' : ''}`}
        onClick={() => onTabChange('전체')}
      >
        <Users size={16} /> 전체
      </button>
      <div className="user-tabs-divider" />

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
      </div>
    </div>
  );
};

export const userList = users;
export default UserTabs;

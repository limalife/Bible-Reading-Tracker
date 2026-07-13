import { chapterIndex, totalBibleChapters } from '../data/bibleData';

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const pad2 = (n) => String(n).padStart(2, '0');

// 로컬 기준 'YYYY-MM-DD'. toISOString()은 UTC라 한국 오전에 전날로 밀린다.
export const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const addDays = (d, n) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};

// 그 주의 일요일 (한 주는 일요일 ~ 토요일)
export const sundayOf = (d) => addDays(d, -d.getDay());

// 계획에서 해당 날짜까지의 누적 목표 장수.
// 그 날짜에 등록이 없으면 이전 등록일 중 가장 최근 것을 쓴다 → 등록을 걸러도 목표가 0으로 리셋되지 않는다.
export const targetIndexOn = (days, key) => {
  let bestKey = null;
  for (const k of Object.keys(days || {})) {
    if (k <= key && (bestKey === null || k > bestKey)) bestKey = k;
  }
  if (bestKey === null) return null;

  const pos = days[bestKey];
  return {
    key: bestKey,
    index: Math.min(chapterIndex(pos.bookId, pos.chapter), totalBibleChapters),
  };
};

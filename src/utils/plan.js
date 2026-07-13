import { chapterIndex, positionAt, totalBibleChapters } from '../data/bibleData';

// 일요일은 '주일'의 '주'로 표기한다.
export const WEEKDAYS = ['주', '월', '화', '수', '목', '금', '토'];

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

// 누적 장수 구간(from~to)을 읽기 범위로 표기.
// 같은 책이면 "창세기 21~34장", 책을 넘어가면 "창세기 35장 ~ 출애굽기 8장".
const rangeLabel = (fromIndex, toIndex) => {
  const from = positionAt(fromIndex);
  const to = positionAt(toIndex);
  if (!from || !to) return '';
  if (from.book.id === to.book.id) {
    return from.chapter === to.chapter
      ? `${to.book.name} ${to.chapter}장`
      : `${to.book.name} ${from.chapter}~${to.chapter}장`;
  }
  return `${from.book.name} ${from.chapter}장 ~ ${to.book.name} ${to.chapter}장`;
};

// 카톡 공유에 함께 붙일 "이번 주 진도" 텍스트. 등록된 날이 없으면 빈 문자열.
export const weekPlanText = (days, today = new Date()) => {
  const weekStart = sundayOf(today);
  const weekEnd = addDays(weekStart, 6);
  let prevIndex = targetIndexOn(days, dateKey(addDays(weekStart, -1)))?.index ?? 0;

  const lines = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const pos = days?.[dateKey(d)];
    if (!pos) continue; // 진도 없는 날은 건너뛴다

    const index = Math.min(chapterIndex(pos.bookId, pos.chapter), totalBibleChapters);
    const label = index > prevIndex ? rangeLabel(prevIndex + 1, index) : rangeLabel(index, index);
    lines.push(`${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]}) ${label}`);
    prevIndex = index;
  }

  if (lines.length === 0) return '';

  const header = `📖 이번 주 진도 (${weekStart.getMonth() + 1}/${weekStart.getDate()}~${weekEnd.getMonth() + 1}/${weekEnd.getDate()})`;
  return [header, ...lines].join('\n');
};

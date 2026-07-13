import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Save, AlertTriangle } from 'lucide-react';
import { allBooks, chapterIndex, formatPosition } from '../data/bibleData';
import { savePlanDays } from '../firebase';
import { WEEKDAYS, dateKey, addDays, mondayOf, targetIndexOn } from '../utils/plan';

// 주간 정독 계획 등록 화면 (?admin=1 일 때만 진입).
// 날짜별로 "그날까지 읽어야 할 끝 위치(책 + 장)"를 직접 고른다.
const AdminPlan = ({ plan, onClose, onSaved }) => {
  const [days, setDays] = useState(plan.days || {});
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [picks, setPicks] = useState({}); // dateKey → { bookId, chapter } | null
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // 이번 주 직전까지의 진도 — 첫날 선택이 여기보다 뒤인지 검증하는 기준
  const baseIndex = useMemo(() => {
    const prev = targetIndexOn(days, dateKey(addDays(weekStart, -1)));
    return prev ? prev.index : 0;
  }, [days, weekStart]);

  // 이미 등록된 주차를 열면 저장된 값으로 채운다.
  useEffect(() => {
    const next = {};
    for (const d of weekDates) {
      const key = dateKey(d);
      next[key] = days[key] ? { ...days[key] } : null;
    }
    setPicks(next);
  }, [weekDates, days]);

  // 각 행의 누적 장수 + 앞 날짜보다 뒤로 갔는지(역행) 판정
  const rows = useMemo(() => {
    let prevIndex = baseIndex;
    return weekDates.map((d) => {
      const key = dateKey(d);
      const pick = picks[key] || null;
      const index = pick ? chapterIndex(pick.bookId, pick.chapter) : null;
      const invalid = index !== null && index < prevIndex;
      if (index !== null) prevIndex = index;
      return { date: d, key, pick, index, invalid, prevIndex };
    });
  }, [weekDates, picks, baseIndex]);

  const hasInvalid = rows.some(r => r.invalid);
  const todayKey = dateKey(new Date());

  const setBook = (key, bookId) => {
    setPicks((p) => {
      if (!bookId) return { ...p, [key]: null };
      const book = allBooks.find(b => b.id === bookId);
      // 책을 바꿔도 이미 고른 장은 유지하되, 그 책의 장수를 넘지 않도록 맞춘다.
      const chapter = Math.min(p[key]?.chapter || 1, book.chapters);
      return { ...p, [key]: { bookId, chapter } };
    });
  };

  const setChapter = (key, chapter) => {
    setPicks((p) => (p[key] ? { ...p, [key]: { ...p[key], chapter: Number(chapter) } } : p));
  };

  const handleSave = async () => {
    if (hasInvalid) {
      alert('앞 날짜보다 뒤로 가는 날이 있습니다. 빨간색으로 표시된 줄을 확인해 주세요.');
      return;
    }
    setSaving(true);
    try {
      // 비워둔 날은 등록하지 않는다 → 그 날의 목표는 직전 등록일 위치를 유지한다.
      const patch = {};
      for (const row of rows) {
        if (row.pick) patch[row.key] = { bookId: row.pick.bookId, chapter: row.pick.chapter };
      }

      if (Object.keys(patch).length === 0) {
        alert('등록할 진도가 없습니다. 책과 장을 선택해 주세요.');
        return;
      }

      await savePlanDays(patch);
      const merged = { ...days, ...patch };
      setDays(merged);
      onSaved(merged);
      setSavedAt(Date.now());
    } catch (e) {
      console.error(e);
      alert('저장에 실패했습니다. 네트워크를 확인해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={S.head}>
          <strong style={{ fontSize: '1.05rem' }}>주간 진도 등록</strong>
          <button onClick={onClose} style={S.iconBtn} aria-label="닫기"><X size={18} /></button>
        </div>

        <div style={S.weekNav}>
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} style={S.iconBtn} aria-label="이전 주">
            <ChevronLeft size={18} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700 }}>{weekStart.getFullYear()}년 {weekStart.getMonth() + 1}월</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {weekStart.getMonth() + 1}/{weekStart.getDate()} ~ {addDays(weekStart, 6).getMonth() + 1}/{addDays(weekStart, 6).getDate()}
            </div>
          </div>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} style={S.iconBtn} aria-label="다음 주">
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={S.baseLine}>
          지난 진도: <b>{baseIndex > 0 ? formatPosition(baseIndex) : '없음 (처음부터)'}</b> 에서 이어집니다
        </div>

        <p style={S.hint}>각 날짜에 <b>그날까지 읽어야 할 마지막 위치</b>를 고르세요. 비워두면 그 날은 진도가 없는 날입니다.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {rows.map((row) => {
            const isToday = row.key === todayKey;
            const book = row.pick ? allBooks.find(b => b.id === row.pick.bookId) : null;
            return (
              <div
                key={row.key}
                style={{
                  ...S.row,
                  ...(isToday ? S.rowToday : null),
                  ...(row.invalid ? S.rowInvalid : null),
                }}
              >
                <span style={{ width: '4.4rem', flexShrink: 0, fontSize: '0.85rem', fontWeight: isToday ? 700 : 500 }}>
                  {row.date.getMonth() + 1}/{row.date.getDate()} ({WEEKDAYS[row.date.getDay()]})
                </span>

                <select
                  value={row.pick?.bookId || ''}
                  onChange={(e) => setBook(row.key, e.target.value)}
                  style={{ ...S.select, flex: 1, minWidth: 0 }}
                >
                  <option value="">— 없음 —</option>
                  {allBooks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                <select
                  value={row.pick?.chapter || ''}
                  onChange={(e) => setChapter(row.key, e.target.value)}
                  disabled={!book}
                  style={{ ...S.select, width: '4.6rem', flexShrink: 0, opacity: book ? 1 : 0.4 }}
                >
                  {book
                    ? Array.from({ length: book.chapters }, (_, i) => i + 1).map(c => (
                        <option key={c} value={c}>{c}장</option>
                      ))
                    : <option value="">-</option>}
                </select>
              </div>
            );
          })}
        </div>

        {hasInvalid && (
          <p style={S.warn}>
            <AlertTriangle size={14} /> 앞 날짜보다 뒤로 가는 날이 있습니다. 진도는 성경 순서대로만 등록할 수 있습니다.
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || hasInvalid}
          style={{ ...S.saveBtn, opacity: saving || hasInvalid ? 0.5 : 1, cursor: hasInvalid ? 'not-allowed' : 'pointer' }}
        >
          <Save size={16} /> {saving ? '저장 중...' : '이 주차 저장'}
        </button>

        {savedAt && (
          <p style={{ margin: '0.6rem 0 0', textAlign: 'center', fontSize: '0.8rem', color: '#2e8b57', fontWeight: 700 }}>
            저장했습니다. 모든 사람에게 바로 반영됩니다.
          </p>
        )}
      </div>
    </div>
  );
};

const S = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
  },
  sheet: {
    background: '#fff', borderRadius: '16px', padding: '1.1rem', width: '100%', maxWidth: '440px',
    maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' },
  iconBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px',
    borderRadius: '8px', color: 'var(--text-secondary)', display: 'inline-flex',
  },
  weekNav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg-color)', borderRadius: '10px', padding: '0.5rem 0.6rem',
  },
  baseLine: {
    margin: '0.7rem 0 0.5rem', padding: '0.5rem 0.7rem', background: 'var(--accent-light)',
    borderRadius: '8px', fontSize: '0.8rem', color: 'var(--accent-hover)',
  },
  hint: {
    margin: '0 0 0.7rem', fontSize: '0.76rem', color: 'var(--text-secondary)',
    lineHeight: 1.5, wordBreak: 'keep-all',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.5rem',
    borderRadius: '8px', border: '1px solid transparent',
  },
  rowToday: { background: 'var(--accent-light)' },
  rowInvalid: { background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.5)' },
  select: {
    padding: '0.4rem 0.4rem', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '8px',
    fontSize: '0.85rem', background: '#fff', color: 'var(--text-primary)',
  },
  warn: {
    display: 'flex', alignItems: 'center', gap: '6px', margin: '0.7rem 0 0',
    fontSize: '0.78rem', color: '#c22', fontWeight: 600, wordBreak: 'keep-all',
  },
  saveBtn: {
    width: '100%', marginTop: '1rem', background: 'var(--accent-color)', color: '#fff',
    border: 'none', padding: '0.75rem', borderRadius: '99px', fontSize: '0.95rem',
    fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', gap: '8px',
  },
};

export default AdminPlan;

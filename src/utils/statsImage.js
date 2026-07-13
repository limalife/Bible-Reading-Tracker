// 다락방 전체 현황 표 + 이번 주 일자별 진도를 하나의 PNG 캔버스로 그린다.
// 카톡은 공유 시트의 텍스트(EXTRA_TEXT)를 무시하는 경우가 있어 진도를 이미지에 직접 넣는다.
export const buildStatsCanvas = ({ users, planInfo, planText, getPace }) => {
  const { targetPos, targetChapters, todayLabel, daysElapsed } = planInfo;

  const cols = [
    { key: 'name', label: '이름', w: 84, align: 'left' },
    { key: 'pos', label: '현재 위치', w: 150, align: 'left' },
    { key: 'read', label: '읽은 장수', w: 76, align: 'center' },
    { key: 'pace', label: '진도율', w: 82, align: 'center' },
    { key: 'total', label: '전체 진도', w: 96, align: 'center' },
  ];

  const planLines = planText ? planText.split('\n') : [];
  const planHeader = planLines[0] || '';
  const planRows = planLines.slice(1);

  const M = 16;              // 바깥 여백
  const titleH = 38, headH = 32, rowH = 30;
  const planGap = 12, planHeadH = 30, planRowH = 26;
  const planH = planRows.length ? planGap + planHeadH + planRowH * planRows.length : 0;
  const tableW = cols.reduce((a, c) => a + c.w, 0);
  const W = tableW + M * 2;
  const H = M * 2 + titleH * 2 + headH + rowH * users.length + planH;

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
  users.forEach((u) => {
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

  // 이번 주 일자별 진도 (계획이 등록된 경우에만)
  if (planRows.length) {
    y += planGap;

    ctx.fillStyle = '#dce6f1';
    ctx.fillRect(x0, y, tableW, planHeadH);
    ctx.strokeStyle = '#b0b0b0';
    ctx.strokeRect(x0, y, tableW, planHeadH);
    ctx.fillStyle = '#1f3b57';
    ctx.font = font(14, true);
    ctx.textAlign = 'center';
    ctx.fillText(planHeader, x0 + tableW / 2, y + planHeadH / 2 + 1);
    y += planHeadH;

    ctx.font = font(13, false);
    ctx.textAlign = 'left';
    planRows.forEach((line) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x0, y, tableW, planRowH);
      ctx.strokeStyle = '#dcdcdc';
      ctx.strokeRect(x0, y, tableW, planRowH);
      ctx.fillStyle = '#222222';
      ctx.fillText(line, x0 + 10, y + planRowH / 2 + 1);
      y += planRowH;
    });
  }

  return canvas;
};

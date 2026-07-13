/* global __BUILD_ID__ */

// Vite 가 JS/CSS 에는 해시를 붙여주지만 index.html 자체는 GitHub Pages 의 max-age 와
// WebView HTTP 캐시에 그대로 남는다. 그래서 배포를 해도 앱이 옛 index.html → 옛 해시
// 에셋을 계속 참조하는 일이 생긴다. 캐시를 끄는 대신, 배포된 buildId 를 직접 물어보고
// 다르면 우리가 새 문서를 받아오게 한다.

export const CURRENT_BUILD_ID = __BUILD_ID__;

const VERSION_URL = new URL('version.json', document.baseURI).href;

export async function fetchLatestBuildId() {
  try {
    // 이 요청까지 캐시되면 의미가 없으므로 no-store + 쿼리로 이중 방어한다.
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.buildId ?? null;
  } catch {
    // 오프라인이거나 배포 중일 수 있다. 갱신 없음으로 간주하고 조용히 넘어간다.
    return null;
  }
}

// location.reload() 는 같은 URL 을 다시 요청해 캐시에 그대로 걸릴 수 있다.
// 쿼리를 바꿔 URL 자체를 다르게 만들어야 새 index.html 이 내려온다.
export function reloadToLatest(buildId) {
  const url = new URL(window.location.href);
  url.searchParams.set('v', buildId ?? String(Date.now()));
  window.location.replace(url.toString());
}

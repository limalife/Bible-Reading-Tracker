import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 빌드마다 새로 발급되는 식별자. 번들 안에는 __BUILD_ID__ 로 박히고, 같은 값이
// dist/version.json 으로도 나가서 앱이 둘을 비교해 갱신 여부를 판단한다.
const BUILD_ID = String(Date.now())

function emitVersion() {
  return {
    name: 'emit-version',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildId: BUILD_ID }),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), emitVersion()],
  base: './',
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
})

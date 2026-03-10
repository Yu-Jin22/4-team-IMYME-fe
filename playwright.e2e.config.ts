import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const E2E_WEB_SERVER_COMMAND = 'pnpm dev'
const E2E_WEB_SERVER_TIMEOUT_MS = 120_000
const E2E_WORKER_COUNT = 1
const E2E_STORAGE_STATE_PATH = 'playwright/.auth/e2e-user.json'

// E2E_BASE_URL이 없으면 로컬 서버를 자동 실행
const shouldStartServer = !process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  workers: E2E_WORKER_COUNT,
  globalSetup: './tests/e2e/global-setup.ts',

  // ✅ 테스트 1개당 최대 실행 시간
  timeout: 60_000,

  // ✅ CI에서만 flaky 완화용 재시도(로컬은 0회)
  retries: process.env.CI ? 1 : 0,

  // ✅ 모든 테스트에 공통 적용되는 옵션
  use: {
    baseURL,
    storageState: E2E_STORAGE_STATE_PATH,

    // ✅ 재시도 1회차에서 실패하면 트레이스를 남겨서 디버깅을 쉽게 함
    trace: 'on-first-retry',

    // ✅ 실패한 테스트만 스크린샷/영상 저장
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // ✅ 브라우저/디바이스 세팅
  projects: [
    {
      name: 'chromium',

      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 로컬에서 E2E 실행 시 Playwright가 Next 서버를 자동 실행
  webServer: shouldStartServer
    ? {
        command: E2E_WEB_SERVER_COMMAND,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: E2E_WEB_SERVER_TIMEOUT_MS,
      }
    : undefined,
})

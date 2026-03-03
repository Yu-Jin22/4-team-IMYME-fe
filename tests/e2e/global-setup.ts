import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

import { request } from '@playwright/test'

const DEFAULT_E2E_BASE_URL = 'http://localhost:3000'
const E2E_LOGIN_PATH = '/api/e2e/login'
const STORAGE_STATE_PATH = 'playwright/.auth/e2e-user.json'

export default async function globalSetup() {
  const baseURL = process.env.E2E_BASE_URL ?? DEFAULT_E2E_BASE_URL
  const requestContext = await request.newContext({ baseURL })

  const response = await requestContext.post(E2E_LOGIN_PATH, {
    data: { deviceUuid: randomUUID() },
  })

  if (!response.ok()) {
    const responseBody = await response.text()
    throw new Error(
      `E2E login failed during global setup: ${response.status()} ${response.statusText()} ${responseBody}`,
    )
  }

  await mkdir(dirname(STORAGE_STATE_PATH), { recursive: true })
  await requestContext.storageState({ path: STORAGE_STATE_PATH })
  await requestContext.dispose()
}

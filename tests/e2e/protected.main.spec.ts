import { test, expect } from '@playwright/test'

test('보호 라우트 /main 접근 시 프로필 대시보드가 보인다', async ({ page }) => {
  await page.goto('/main', { waitUntil: 'load' })
  await expect(page).toHaveURL(/\/main/)
  await expect(page.getByAltText('profile image')).toBeVisible()
  await expect(page.getByText('카드 수', { exact: true })).toBeVisible()
  await expect(page.getByText('승리', { exact: true })).toBeVisible()
  await expect(page.getByText('레벨', { exact: true })).toBeVisible()

  await expect(page.getByText('레벨업 모드', { exact: true })).toBeVisible()
  await expect(page.getByText('PVP 모드', { exact: true })).toBeVisible()

  await expect(page.getByText('최근 학습', { exact: true })).toBeVisible()
  await expect(page.getByText('최근 대결', { exact: true })).toBeVisible()
})

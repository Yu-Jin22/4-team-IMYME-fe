import { test, expect } from '@playwright/test'

test('보호 라우트 /mypage 접근 시 프로필 대시보드 및 카드 목록이 보인다.', async ({ page }) => {
  await page.goto('/mypage', { waitUntil: 'load' })
  await expect(page).toHaveURL(/\/mypage/)
  await expect(page.getByAltText('profile image', { exact: true })).toBeVisible()
  await expect(page.getByText('카드 수', { exact: true })).toBeVisible()
  await expect(page.getByText('승리', { exact: true })).toBeVisible()
  await expect(page.getByText('레벨', { exact: true })).toBeVisible()

  await expect(page.getByText('학습 목록')).toBeVisible()
  await expect(page.getByText('대결 목록')).toBeVisible()
})

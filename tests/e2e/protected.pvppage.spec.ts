import { test, expect } from '@playwright/test'

test('pvp 페이지 접근 시 매칭 입장/만들기 버튼이 보인다.', async ({ page }) => {
  await page.goto('/pvp', { waitUntil: 'load' })
  await expect(page).toHaveURL(/\/pvp/)

  await expect(page.getByText('매칭 입장하기', { exact: true })).toBeVisible()
  await expect(page.getByText('매칭 만들기', { exact: true })).toBeVisible()

  await expect(page.getByText('최근 대결', { exact: true })).toBeVisible()
})

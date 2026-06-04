import { test, expect } from '@playwright/test'

// Smoke tests that run without authentication (just checking public-facing redirects)
test.describe('Smoke tests', () => {
  test('app loads and redirects to login', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(500)
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page renders the Tablify brand', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('tablify')).toBeVisible()
    await expect(page.getByText('Staff only')).toBeVisible()
  })
})

// Authenticated flow tests — run these with a test user configured via env vars
test.describe('Authenticated flows', () => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL env var')

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('dashboard shows stat cards', async ({ page }) => {
    await expect(page.getByText('Tables Occupied')).toBeVisible()
    await expect(page.getByText('Open Tabs')).toBeVisible()
    await expect(page.getByText('Active Orders')).toBeVisible()
  })

  test('tables page loads', async ({ page }) => {
    await page.goto('/tables')
    await expect(page.getByRole('heading', { name: 'Tables' })).toBeVisible()
  })

  test('tabs page loads', async ({ page }) => {
    await page.goto('/tabs')
    await expect(page.getByRole('heading', { name: 'Tabs' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open Tab' })).toBeVisible()
  })

  test('orders page loads with filter buttons', async ({ page }) => {
    await page.goto('/orders')
    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible()
    await expect(page.getByText('Pending')).toBeVisible()
    await expect(page.getByText('Paid')).toBeVisible()
  })

  test('kitchen page loads', async ({ page }) => {
    await page.goto('/kitchen')
    await expect(page.getByRole('heading', { name: 'Kitchen Display' })).toBeVisible()
  })
})

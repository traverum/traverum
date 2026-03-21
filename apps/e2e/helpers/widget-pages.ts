import type { Page } from '@playwright/test'

export async function fillCheckoutForm(page: Page, data: {
  firstName: string
  lastName: string
  email: string
  phone: string
}) {
  await page.locator('#firstName').fill(data.firstName)
  await page.locator('#lastName').fill(data.lastName)
  await page.locator('#email').fill(data.email)
  await page.locator('#phone').fill(data.phone)
}

export async function submitCheckoutForm(page: Page) {
  await page.locator('button[type="submit"]').click()
}

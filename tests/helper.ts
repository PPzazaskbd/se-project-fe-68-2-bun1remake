import { expect, Page } from '@playwright/test';

async function logIn(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'LOGIN' }).click();
  await page.getByRole('textbox', { name: 'Email Address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page.waitForURL((url) => url.pathname !== '/login', { timeout: 30000 });
  await page.waitForFunction(
    async () => {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      return Boolean(session?.user?.token);
    },
    undefined,
    { timeout: 30000 },
  );
}

export async function LogInAsAdmin(page:Page) {
  await logIn(page, 'admin1@gmail.com', '676767');
}

export async function LogInAsAdmin2(page:Page) {
  await logIn(page, 'admin@example.com', '12345678');
}

export async function LogInAsUser(page:Page) {
  await logIn(page, 'user01@gmail.com', 'user67');
}

export async function openHotelByName(page: Page, name: string) {
  await page.goto('http://localhost:3000/hotel');
  await page.getByRole('textbox', { name: 'Search by hotel name, city,' }).fill(name);
  await page.locator('article').filter({ hasText: name }).getByRole('link', { name: 'detail' }).first().click();
  await page.waitForURL(url => url.pathname !== '/hotel', { timeout: 30000 });
}

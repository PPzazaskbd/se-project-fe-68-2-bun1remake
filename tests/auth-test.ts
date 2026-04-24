import {Page,expect} from '@playwright/test';

export async function LogInAsAdmin(page:Page) {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'LOGIN' }).click();
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin1@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('676767');
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page.waitForURL('**/', { timeout: 5000 });
  await page.getByRole('link', { name: 'BOOKINGS' }).click();

  await expect(page).toHaveURL(/.*admin/);
}

export async function LogInAsUser(page:Page) {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'LOGIN' }).click();
  await page.getByRole('textbox', { name: 'Email Address' }).fill('user01@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('user67');
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await page.waitForURL('**/', { timeout: 5000 });
  await page.getByRole('link', { name: 'BOOKINGS' }).click();

  await expect(page).toHaveURL(/.*mybooking/);
}
import {Page,expect} from '@playwright/test';

export async function LogInAsAdmin(page:Page) {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'LOGIN' }).click();
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin1@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('676767');
  await page.getByRole('button', { name: 'LOG IN' }).click();

}

export async function LogInAsAdmin2(page:Page) {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'LOGIN' }).click();
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('12345678');
  await page.getByRole('button', { name: 'LOG IN' }).click();

}

export async function LogInAsUser(page:Page) {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'LOGIN' }).click();
  await page.getByRole('textbox', { name: 'Email Address' }).fill('user01@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('user67');
  await page.getByRole('button', { name: 'LOG IN' }).click();

}
import { test, expect, type Page } from '@playwright/test';
import { LogInAsAdmin, LogInAsAdmin2 } from './auth-test';

async function openHotelByName(page: Page, name: string) {
  await page.goto('http://localhost:3000/hotels');
  await page.getByRole('link', { name: 'HOTELS' }).click();
  await page.getByRole('textbox', { name: 'Search by hotel name, city,' }).fill(name);
  await page.getByRole('link', { name: 'detail' }).first().click();
}


test.describe('Admin delete comment', () => {
  test.beforeEach(async ({ page }) => {
    await LogInAsAdmin(page);
  });
test('Admin delete successful', async ({ page }) => {
  const r = Math.random().toString(36).substring(2, 7);
  
  await openHotelByName(page, 'Test US2-3 Case1');
  await page.getByRole('button', { name: 'Write a review' }).click();
  await page.getByRole('textbox', { name: 'Add your comment' }).click();
  await page.getByRole('button', { name: 'Apply bold' }).click();
  await page.getByRole('textbox', { name: 'Add your comment' }).fill('Test comment ' + r);
  await page.getByRole('textbox', { name: 'Add your comment' }).press('ArrowLeft');
  await page.getByRole('textbox', { name: 'Add your comment' }).fill('Test comment ' + r);
  await page.getByRole('textbox', { name: 'Add your comment' }).click();

  await page.getByRole('textbox', { name: 'Add your comment' }).click();
  await page.getByRole('button', { name: 'Submit Review' }).click();
  await  page.waitForTimeout(2000);
  const myReview = page.getByRole('article').filter({ hasText: 'Test comment ' + r });
  await expect(myReview).toBeVisible();
  await myReview.getByRole('button', { name: 'Delete review' }).click();
  await page.getByRole('button', { name: 'Confirm to DELETE' }).click();
  await  page.waitForTimeout(2000);
  await expect(myReview).toHaveCount(0);
})
  test('Admin delete failed (another admin deleted the comment already but there\'s still loaded in this admin\'s page)', async ({ page, browser }) => {
    const r = Math.random().toString(36).substring(2, 7);


    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await LogInAsAdmin2(pageB);

    await openHotelByName(page, 'Test US2-3 Case2');
    await page.getByRole('button', { name: 'Write a review' }).click();
    await page.getByRole('textbox', { name: 'Add your comment' }).click();
    await page.getByRole('textbox', { name: 'Add your comment' }).fill('Test comment concurrent ' + r);
    await page.getByRole('button', { name: 'Submit Review' }).click();
    await expect(page.getByText('Test comment concurrent ' + r)).toBeVisible();


    await openHotelByName(pageB, 'Test US2-3 Case2');
    await expect(pageB.getByText('Test comment concurrent ' + r)).toBeVisible();

    await page.getByRole('button', { name: 'Delete review' }).click();
    await page.getByRole('button', { name: 'Confirm to DELETE' }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText('Test comment concurrent ' + r)).not.toBeVisible();


    await pageB.getByRole('button', { name: 'Delete review' }).click();
    await pageB.getByRole('button', { name: 'Confirm to DELETE' }).click();
    await pageB.waitForTimeout(2000);

    await expect(pageB.getByText('Test comment concurrent ' + r)).toBeVisible();

    await contextB.close();
  });






}); 
import { test, expect } from '@playwright/test';
import { LogInAsAdmin, LogInAsAdmin2, openHotelByName } from './helper';


test.describe('Admin delete comment', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await LogInAsAdmin(page);
  });
test('Admin delete successful', async ({ page }) => {
  const r = Math.random().toString(36).substring(2, 7);
  const comment = 'Test comment ' + r;
  
  await openHotelByName(page, 'Test US2-3 Case1');
  await page.getByRole('button', { name: 'Write a review' }).click();
  const commentBox = page.getByRole('textbox', { name: 'Add your comment' });
  await commentBox.click();
  await commentBox.pressSequentially(comment);
  await expect(commentBox).toContainText(comment);
  await page.getByRole('button', { name: 'Submit Review' }).click();
  const myReview = page.getByRole('article').filter({ hasText: comment });
  await expect(myReview).toBeVisible({ timeout: 15000 });
  await myReview.getByRole('button', { name: 'Delete review' }).click();
  await page.getByRole('button', { name: 'Confirm to DELETE' }).click();
  await expect(page.getByText('Deleted a comment successfully')).toBeVisible();
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

    await expect(pageB.getByText('Cannot delete this comment')).toBeVisible();
    await expect(pageB.getByText('Test comment concurrent ' + r)).toBeVisible();

    await contextB.close();
  });






}); 

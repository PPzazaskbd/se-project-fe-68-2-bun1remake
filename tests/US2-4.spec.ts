import { test, expect, Locator } from '@playwright/test';
import { LogInAsAdmin, openHotelByName } from './helper';

async function clickDelete(review: Locator) {
  await review.scrollIntoViewIfNeeded();
  await review.hover();

  const deleteBtn = review.getByRole('button', { name: 'Delete review' });
  await expect(deleteBtn).toBeVisible({ timeout: 10000 });
  await deleteBtn.click({ force: true });
}

test.describe('US2-4: Comment Delete Requirements', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await LogInAsAdmin(page);
  });

  test('API delete comment works', async ({ page }) => {
    const comment = 'API test ' + Date.now();

    await openHotelByName(page, 'test playwright');

    await page.getByRole('button', { name: 'Write a review' }).click();
    await page.getByRole('textbox', { name: 'Add your comment' }).fill(comment);
    await page.getByRole('button', { name: 'Submit Review' }).click();

    const review = page.locator('article').filter({ hasText: comment });
    await expect(review).toBeVisible({ timeout: 15000 });

    await clickDelete(review);

    const confirmBtn = page.getByRole('button', { name: 'Confirm to DELETE' });
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await confirmBtn.click();

    await expect(review).toHaveCount(0);
  });

  test('Delete confirmation appears', async ({ page }) => {
    const comment = 'Confirm test ' + Date.now();

    await openHotelByName(page, 'test playwright');

    await page.getByRole('button', { name: 'Write a review' }).click();
    await page.getByRole('textbox', { name: 'Add your comment' }).fill(comment);
    await page.getByRole('button', { name: 'Submit Review' }).click();

    const review = page.locator('article').filter({ hasText: comment });
    await expect(review).toBeVisible({ timeout: 15000 });

    await clickDelete(review);

    const confirmBtn = page.getByRole('button', { name: 'Confirm to DELETE' });
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
  });

  test('Comment is removed after delete', async ({ page }) => {
    const comment = 'Delete test ' + Date.now();

    await openHotelByName(page, 'test playwright');

    await page.getByRole('button', { name: 'Write a review' }).click();
    await page.getByRole('textbox', { name: 'Add your comment' }).fill(comment);
    await page.getByRole('button', { name: 'Submit Review' }).click();

    const review = page.locator('article').filter({ hasText: comment });
    await expect(review).toBeVisible({ timeout: 15000 });

    await clickDelete(review);

    const confirmBtn = page.getByRole('button', { name: 'Confirm to DELETE' });
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await confirmBtn.click();

    await expect(review).toHaveCount(0);
  });

  test('User does not confirm delete (UX)', async ({ page }) => {
    const comment = 'UX test ' + Date.now();

    await openHotelByName(page, 'test playwright');

    await page.getByRole('button', { name: 'Write a review' }).click();
    await page.getByRole('textbox', { name: 'Add your comment' }).fill(comment);
    await page.getByRole('button', { name: 'Submit Review' }).click();

    const review = page.locator('article').filter({ hasText: comment });
    await expect(review).toBeVisible({ timeout: 15000 });

    await clickDelete(review);

    const confirmBtn = page.getByRole('button', { name: 'Confirm to DELETE' });
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });

    await expect(review).toBeVisible();
  });
});
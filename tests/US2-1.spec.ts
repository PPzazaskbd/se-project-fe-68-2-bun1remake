import { test, expect } from '@playwright/test';
import { LogInAsUser, openHotelByName } from './helper';

test.describe('User Story 2-1',()=>{
   test.describe('Logged In Cases', () => {
        test.beforeEach(async ({ page }) => {
            await LogInAsUser(page);
        });
        test('Acceptance criteria 1',async ({page})=>{
            test.setTimeout(60000);
            await openHotelByName(page, 'The Mandarin Residences');
            await page.getByRole('button', { name: 'Write a review' }).click();
            await page.getByRole('button', { name: 'Rate 4' }).click();
            await page.getByRole('textbox', { name: 'Add your comment' }).fill('Good');
            await page.getByRole('button', { name: 'Submit Review' }).click();

            const review = page.locator('div').filter({ hasText: 'Good' }).first();
            await expect(review).toContainText('4.0');
            await expect(review).toContainText('user1');
            await expect(review).toContainText('Good');
        });
        test('Acceptance criteria 2-1:No Comment',async ({page})=>{
            test.setTimeout(60000);
            await openHotelByName(page, 'Capella Bangkok');
            await page.getByRole('button', { name: 'Write a review' }).click();
            await page.getByRole('button', { name: 'Rate 4' }).click();
            await page.getByRole('button', { name: 'Submit Review' }).click();

            await expect(page.getByText('Please write a comment.')).toBeVisible();
        });
    });
    test.describe('Guest Cases (Not Login)', () => {
        test('Acceptance criteria 2-2:Not Login',async ({page})=>{
            test.setTimeout(60000);
            await openHotelByName(page, 'Four Seasons Chiang Mai');
            await page.getByRole('button', { name: 'Write a review' }).click();
            await page.getByRole('button', { name: 'Rate 1' }).click();
            await page.getByRole('textbox', { name: 'Add your comment' }).fill('Suck');
            await page.getByRole('button', { name: 'Submit Review' }).click();

            await page.waitForTimeout(5000);

            await expect(page.getByRole('button', { name: 'Submit Review' })).toBeVisible();
            await expect(page.locator('article').filter({ hasText: 'Suck' })).not.toBeVisible();
        });
    });
});
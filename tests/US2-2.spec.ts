import { test, expect } from '@playwright/test';
import { LogInAsUser, openHotelByName } from './helper';

test.describe('User Story 2-2',()=>{
   test.describe('Logged In Cases', () => {
        test.beforeEach(async ({ page }) => {
            await LogInAsUser(page);
        });
        test('Acceptance criteria 1',async ({page})=>{
            await openHotelByName(page, 'Anantara Riverside');
            //delay 3s
            await page.waitForTimeout(3000);

            await expect(page.locator('h2')).toContainText('5.0★');

            //delay 3s
            await page.waitForTimeout(3000);

        });

        test('Acceptance criteria 2',async ({page})=>{
            await openHotelByName(page, 'playwright');
            await expect(page.getByText('No ratings yet')).toBeVisible({ timeout: 15000 });

            //delay 3s
            await page.waitForTimeout(3000);

        })
    });
});

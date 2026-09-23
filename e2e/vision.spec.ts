import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test('attach a crop photo and receive a bounded safe diagnosis response', async ({
  page,
}) => {
  await page.goto('/register');
  await page
    .getByLabel('Email')
    .fill(`vision-browser-${randomUUID()}@example.test`);
  const password = `${randomUUID()}Aa1!`;
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Confirm').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/onboarding/, { timeout: 30_000 });
  await page.goto('/farming-intelligence');
  await page.locator('input[type="file"][accept*="image"]').setInputFiles({
    name: 'crop.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  });
  await expect(page.getByAltText('Attached crop')).toBeVisible();
  await page.getByLabel('Your question').fill('What problem is visible?');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByLabel('Assistant response').last()).toContainText(
    /cannot make a reliable diagnosis|image analysis is currently unavailable|clear close-ups/iu,
    { timeout: 120_000 },
  );
  await page.getByRole('button', { name: 'Remove crop photo' }).click();
  await expect(page.getByAltText('Attached crop')).toBeHidden();
});

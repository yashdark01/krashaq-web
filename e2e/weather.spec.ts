import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
test('register, create a located farm, assign crop and receive live weather evidence', async ({
  page,
}) => {
  await page.goto('/register');
  await page.getByLabel('Email').fill(`browser-${randomUUID()}@example.test`);
  const password = randomUUID() + 'Aa1!';
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Confirm').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/onboarding/, { timeout: 30_000 });
  await page.getByLabel('Farm name').fill('Browser verification farm');
  await page.getByLabel('Latitude', { exact: true }).fill('23.2599');
  await page.getByLabel('Longitude', { exact: true }).fill('77.4126');
  await page.getByRole('button', { name: 'Finish setup', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto('/farms');
  await page.getByRole('link', { name: 'Browser verification farm' }).click();
  await page.getByLabel('Crop', { exact: true }).fill('wheat');
  await page.getByLabel('Growth stage').fill('vegetative');
  await page.getByRole('button', { name: 'Assign crop' }).click();
  await expect(page.getByRole('status')).toHaveText('Crop assigned.');
  await page.goto('/chat');
  await page
    .getByLabel('Your question')
    .fill('Will it rain on my farm tomorrow?');
  await page.getByRole('button', { name: 'Send question' }).click();
  const assistant = page.getByLabel('Assistant response').last();
  await expect(assistant).not.toBeEmpty({ timeout: 250000 });
  await assistant.getByRole('button', { name: /source/ }).click();
  await expect(page.getByLabel('Source 1')).toContainText(
    'krashaq.weather.forecast',
  );
  await page.screenshot({
    path: 'test-results/weather-chat.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'test-results/weather-chat-mobile.png',
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

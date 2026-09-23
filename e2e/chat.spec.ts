import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('global chat keeps a transcript and manages its conversation', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Email').fill(`chat-browser-${randomUUID()}@example.test`);
  const password = `${randomUUID()}Aa1!`;
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Confirm').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/onboarding/, { timeout: 30_000 });

  await page.goto('/krashaq-ai');
  await page.getByLabel('Your question').fill('Hi');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('button', { name: 'Copy answer' })).toHaveCount(1, {
    timeout: 120_000,
  });
  const firstAnswer = page.getByLabel('Assistant response').last();
  await expect(firstAnswer).not.toContainText(/H\s*II regions|ionized hydrogen|star formation/iu);

  await page.getByLabel('Your question').fill('Thanks');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('button', { name: 'Copy answer' })).toHaveCount(2, {
    timeout: 120_000,
  });
  await expect(page.getByLabel('Your message')).toHaveCount(2);
  await expect(page.getByLabel('Assistant response')).toHaveCount(2);

  await page.getByLabel('Manage Hi').click();
  await page.getByRole('button', { name: 'Rename' }).click();
  const title = page.locator('.chat-thread-row input');
  await title.fill('Friendly greeting');
  await title.press('Enter');
  await expect(page.getByRole('button', { name: 'Friendly greeting' })).toBeVisible();

  await page.getByLabel('Manage Friendly greeting').click();
  await page.getByRole('button', { name: 'Pin', exact: true }).click();
  await page.getByLabel('Manage Friendly greeting').click();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await page.getByRole('button', { name: 'Archived' }).click();
  await expect(page.getByRole('button', { name: 'Friendly greeting' })).toBeVisible();
  await page.getByLabel('Manage Friendly greeting').click();
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await page.getByRole('button', { name: 'Recent' }).click();
  await expect(page.getByRole('button', { name: 'Friendly greeting' })).toBeVisible();
});

import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('protected action pauses for approval and resumes after approve', async ({
  page,
}) => {
  await page.goto('/register');
  await page
    .getByLabel('Email')
    .fill(`approval-browser-${randomUUID()}@example.test`);
  await page.getByLabel('Password').fill(`${randomUUID()}Aa1!`);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 30_000 });
  await page.goto('/chat');
  await page.getByLabel('Your question').fill('Run an approval test');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.locator('.approval-panel')).toBeVisible({
    timeout: 250000,
  });
  await expect(page.locator('.approval-panel')).toContainText(
    'krashaq.approval-test.write',
  );
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.locator('.answer')).not.toBeEmpty({ timeout: 250000 });
});

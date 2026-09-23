import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

function makeTextPdf(text: string) {
  const stream = `BT\n/F1 16 Tf\n72 720 Td\n(${text.replace(/[()\\]/g, '\\$&')}) Tj\nET\n`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join(
      '',
    )}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

test('upload a PDF, index it, answer from it, and open its page citation', async ({
  page,
}) => {
  await page.goto('/register');
  await page
    .getByLabel('Email')
    .fill(`rag-browser-${randomUUID()}@example.test`);
  const password = `${randomUUID()}Aa1!`;
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Confirm').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/onboarding/, { timeout: 30_000 });
  await page.goto('/knowledge');
  await page.getByLabel('Document title').fill('Wheat irrigation guidance');
  await page.getByLabel('PDF file').setInputFiles({
    name: 'wheat-irrigation.pdf',
    mimeType: 'application/pdf',
    buffer: makeTextPdf(
      'Wheat irrigation should consider rainfall forecasts and measured soil moisture.',
    ),
  });
  await page.getByRole('button', { name: 'Upload and index' }).click();
  await expect(page.getByText('Indexed and ready to use in chat')).toBeVisible({
    timeout: 120000,
  });
  await page.getByRole('link', { name: 'Ask about this document' }).click();
  await expect(page).toHaveURL(/chat\?document=/);
  await page
    .getByLabel('Your question')
    .fill('What does my uploaded document say about wheat irrigation?');
  await page.getByRole('button', { name: 'Send question' }).click();
  const assistant = page.getByLabel('Assistant response').last();
  await expect(assistant).not.toBeEmpty({ timeout: 250000 });
  await assistant.getByRole('button', { name: /source/ }).click();
  const source = page.getByLabel('Source 1');
  await expect(source).toContainText('Wheat irrigation guidance');
  await expect(source).toContainText('Page 1');
  await expect(
    source.getByRole('link', { name: 'Open cited PDF' }),
  ).toHaveAttribute('href', /\/v1\/documents\/.*\/content#page=1/);
});

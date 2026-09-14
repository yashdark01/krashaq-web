import { describe, expect, it } from 'vitest';
import { api } from '../src/lib/api/platform.api';

describe('platform approval endpoints', () => {
  it('registers approval query and mutation endpoints', () => {
    expect(Object.keys(api.endpoints)).toEqual(
      expect.arrayContaining([
        'runApproval',
        'approveRun',
        'denyRun',
        'resumeRun',
      ]),
    );
  });
});

describe('platform market and reference endpoints', () => {
  it('registers market history and reference record queries', () => {
    expect(Object.keys(api.endpoints)).toEqual(
      expect.arrayContaining(['markets', 'marketHistory', 'referenceRecords']),
    );
  });
});

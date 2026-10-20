import { describe, it, expect } from 'vitest';
import { createTestClient } from '../utils/client.js';
import { jsonResponse } from '../utils/http.js';
import { MOCK_PROJECT_LIST_ITEM, MOCK_REVIEW, syncPage } from '../utils/fixtures.js';
import type { ProjectSyncRow } from '../../src/types/index.js';

describe('SyncApi', () => {
  it('lists a page of project changes with tombstones', async () => {
    const rows: ProjectSyncRow[] = [
      MOCK_PROJECT_LIST_ITEM,
      { id: 9, removed: true, reason: 'deleted' },
      { id: 10, removed: true, reason: 'merged', canonical_id: 1234 },
    ];
    const { client, mockFetch } = createTestClient([jsonResponse(syncPage(rows, 'c1', false))]);
    const page = await client.sync.listProjects({ since: '2026-10-01T00:00:00Z' });
    expect(page.data).toEqual(rows);
    expect(mockFetch.lastCall()?.url).toBe(
      'https://moddex.gg/api/v2/sync/projects?since=2026-10-01T00%3A00%3A00Z',
    );
  });

  it('follows the cursor until has_more is false, sending since only on the first page', async () => {
    const { client, mockFetch } = createTestClient([
      jsonResponse(syncPage([MOCK_REVIEW], 'c1', true)),
      jsonResponse(syncPage([{ ...MOCK_REVIEW, id: 78 }], 'c2', true)),
      jsonResponse(syncPage([], 'c3', false)),
    ]);

    const cursors: string[] = [];
    for await (const page of client.sync.iterateReviewPages({ since: '2026-10-01', unmasked: true })) {
      cursors.push(page.meta.next_cursor);
    }

    expect(cursors).toEqual(['c1', 'c2', 'c3']);
    expect(mockFetch.calls.map((call) => new URL(call.url).search)).toEqual([
      '?since=2026-10-01&unmasked=1',
      '?unmasked=1&cursor=c1',
      '?unmasked=1&cursor=c2',
    ]);
  });

  it('starts from a stored cursor', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse(syncPage([], 'c9', false))]);
    for await (const page of client.sync.iterateProjectPages({ cursor: 'c8', per_page: 10 })) {
      expect(page.meta.has_more).toBe(false);
    }
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v2/sync/projects?per_page=10&cursor=c8');
  });

  it('lists public review IDs', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse({ data: [3, 77, 104] })]);
    expect(await client.sync.listReviewIds()).toEqual([3, 77, 104]);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/v2/sync/reviews/ids');
  });
});

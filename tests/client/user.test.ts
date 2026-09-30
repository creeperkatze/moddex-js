import { describe, it, expect } from 'vitest';
import { createTestClient } from '../utils/client.js';
import { jsonResponse } from '../utils/http.js';
import { MOCK_USER } from '../utils/fixtures.js';

describe('UserApi', () => {
  it('gets the authenticated user and unwraps the data envelope', async () => {
    const { client, mockFetch } = createTestClient([jsonResponse({ data: MOCK_USER })]);
    const user = await client.user.get();
    expect(user).toEqual(MOCK_USER);
    expect(mockFetch.lastCall()?.url).toBe('https://moddex.gg/api/user');
  });
});

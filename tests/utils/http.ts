export type MockFetch = ReturnType<typeof createMockFetch>;

/** Creates a mock fetch that records calls and replies from a queue of responses. */
export function createMockFetch(responses: Response[] = []) {
  const calls: Request[] = [];
  const queue = [...responses];

  const mockFetch = async (input: Request | URL | string, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    calls.push(request);
    const response = queue.shift();
    if (!response) {
      throw new Error(`Unexpected fetch call: ${request.method} ${request.url}`);
    }
    return response;
  };

  return Object.assign(mockFetch, {
    calls,
    lastCall: () => calls[calls.length - 1],
    callCount: () => calls.length,
  });
}

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { 'Content-Type': 'text/plain' },
  });
}

export function errorResponse(status: number, body?: unknown, headers: Record<string, string> = {}): Response {
  return jsonResponse(body ?? { message: `HTTP ${status}` }, status, headers);
}

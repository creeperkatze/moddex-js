# Runtimes & Custom Fetch

## Supported runtimes

The client only uses web-standard APIs (`fetch`, `Headers`, `URL`, `AbortController`, `structuredClone`), so it runs in:

- Node.js 18 and newer
- Browsers
- Browser extension service workers (Manifest V3)
- Deno, Bun, and edge runtimes

It never uses `window`, `document`, or Node-only modules.

## Default fetch

When you don't pass `fetch`, the client looks up `globalThis.fetch` each time it sends a request. It doesn't capture or bind fetch when the module is imported or the client is created, so polyfills and test mocks installed later still work.

## Injecting a fetch implementation

Pass your own `fetch` to add logging, retries, or a proxy, or for runtimes without a global fetch:

```ts
import ModDexClient from 'moddex-js';

const client = new ModDexClient({
  token: 'your-api-token',
  fetch: async (input, init) => {
    console.log('GET', input);
    return fetch(input, init);
  },
});
```

## Extension service workers

```ts
// background.ts
import ModDexClient from 'moddex-js';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'moddex:mod') return;

  chrome.storage.local.get('moddexToken').then(async ({ moddexToken }) => {
    const client = new ModDexClient({ token: moddexToken });
    sendResponse(await client.mods.get(message.slug));
  });

  return true;
});
```

Add `https://moddex.gg/*` to `host_permissions` in your manifest.

## User-Agent

```ts
const client = new ModDexClient({ token: 'your-api-token', userAgent: 'my-dashboard/1.0' });
```

Browsers ignore custom `User-Agent` headers. The option only has an effect in server runtimes.

## Timeout

The default timeout is 10 000 ms. A timed-out request throws `ModDexTimeoutError`.

```ts
const client = new ModDexClient({ token: 'your-api-token', timeoutMs: 30_000 });
```

## Base URL

The default base URL is `https://moddex.gg`. Override it to go through a proxy:

```ts
const client = new ModDexClient({ token: 'your-api-token', baseUrl: 'https://my-proxy.example.com' });
```

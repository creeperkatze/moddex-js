# Runtimes & Custom Fetch

## Supported runtimes

The client only uses web-standard APIs (`fetch`, `Headers`, `URL`, `AbortController`, `structuredClone`), so it runs in:

- Node.js 18 and newer
- Browsers
- Browser extension service workers (Manifest V3)
- Deno, Bun, and edge runtimes

It never uses `window`, `document`, or Node-only modules. ModDex allows every origin through CORS, so browser pages can call it directly.

## Default fetch

When you don't pass `fetch`, the client looks up `globalThis.fetch` each time it sends a request. It doesn't capture or bind fetch when the module is imported or the client is created, so polyfills and test mocks installed later still work.

## Injecting a fetch implementation

Pass your own `fetch` to add logging, retries, or a proxy, or for runtimes without a global fetch:

```ts
import ModDexClient from 'moddex-js';

const client = new ModDexClient({
  client: 'my-app/1.0.0',
  fetch: async (input, init) => {
    console.log('GET', input);
    return fetch(input, init);
  },
});
```

## Extension service workers

No token is needed, so an extension can create one client and reuse it:

```ts
// background.ts
import ModDexClient from 'moddex-js';

const client = new ModDexClient({ client: `my-extension/${chrome.runtime.getManifest().version}` });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'moddex:reviews') return;

  client.lookup
    .listReviews('modrinth', message.slug, { per_page: 5 })
    .then((page) => sendResponse({ ok: true, page }))
    .catch(() => sendResponse({ ok: false }));

  return true;
});
```

Add `https://moddex.gg/*` to `host_permissions` in your manifest if you call it from a content script's origin.

## Identifying your client

```ts
const client = new ModDexClient({ client: 'my-dashboard/1.0.0' });
```

`client` is sent as the `X-Client` header, which works in browsers too. `userAgent` sets the `User-Agent` header, which browsers ignore, so it only has an effect in server runtimes.

## Timeout

The default timeout is 10 000 ms. A timed-out request throws `ModDexTimeoutError`.

```ts
const client = new ModDexClient({ timeoutMs: 30_000 });
```

## Base URL

The default base URL is `https://moddex.gg`. Override it to go through a proxy:

```ts
const client = new ModDexClient({ baseUrl: 'https://my-proxy.example.com' });
```

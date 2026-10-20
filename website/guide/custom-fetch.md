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
  fetch: async (input, init) => {
    console.log('GET', input);
    return fetch(input, init);
  },
});
```

## Client name and User-Agent

```ts
const client = new ModDexClient({ client: 'my-dashboard/1.0.0', userAgent: 'my-dashboard/1.0.0' });
```

`client` is sent as the `X-Client` header and `userAgent` as the `User-Agent` header. Browsers ignore custom `User-Agent` headers, so `client` is the one that works everywhere.

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

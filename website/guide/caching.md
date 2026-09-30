# Caching

The client can keep successful responses in memory so repeated requests don't count against your rate limit. Caching is off by default.

## Enabling the cache

```ts
// Default settings: 60 second TTL, up to 500 responses
const client = new ModDexClient({ token: 'your-api-token', cache: true });

// Custom settings
const client = new ModDexClient({
  token: 'your-api-token',
  cache: { ttlMs: 5 * 60_000, maxEntries: 1_000 },
});
```

| Option | Default | Description |
|---|---|---|
| `ttlMs` | `60000` | How long a response stays fresh, in milliseconds |
| `maxEntries` | `500` | Maximum cached responses. The oldest is removed first when full |

## How it works

- Entries are keyed by the full request URL, including query parameters.
- Only successful responses are cached. Errors always go to the network next time.
- Each read returns a copy, so changing a returned object doesn't change the cache.
- The cache belongs to one client instance and lives only in memory. In an extension service worker it is lost when the worker stops.
- Cached responses don't update [`client.tokenExpiry`](/guide/authentication#token-expiry).

## Clearing the cache

```ts
client.clearCache();
```

# Caching

ModDex marks responses as cacheable for 5 minutes (an hour for the catalog vocabulary), with an `ETag`. In a browser or an extension, the HTTP cache already uses that and revalidates for you.

Server runtimes like Node don't have an HTTP cache, so the client can keep successful responses in memory instead. Repeated requests then don't count against your rate limit. It is off by default.

## Enabling the cache

```ts
// Default settings: 60 second TTL, up to 500 responses
const client = new ModDexClient({ cache: true });

// Matching ModDex's own 5 minutes
const client = new ModDexClient({ cache: { ttlMs: 5 * 60_000, maxEntries: 1_000 } });
```

| Option | Default | Description |
|---|---|---|
| `ttlMs` | `60000` | How long a response stays fresh, in milliseconds |
| `maxEntries` | `500` | Maximum cached responses. The oldest is removed first when full |

## How it works

- Entries are keyed by the full request URL, including query parameters. Sort batch lookup values so identical batches share an entry.
- Only successful responses are cached. Errors always go to the network next time.
- Each read returns a copy, so changing a returned object doesn't change the cache.
- The cache belongs to one client instance and lives only in memory. In an extension service worker it is lost when the worker stops.
- Cached responses don't update [`client.tokenExpiry`](/guide/authentication#token-expiry) or [`client.rateLimit`](/guide/pagination#rate-limits).

## Storing data for longer

The cache is for showing ModDex data next to your own. If you keep ModDex data for longer than the HTTP cache would, ModDex's terms require removing it within 7 days of its removal from ModDex. The [sync feeds](/guide/sync) are built for that.

## Clearing the cache

```ts
client.clearCache();
```

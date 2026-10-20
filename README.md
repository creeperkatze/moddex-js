# moddex-js

A framework-agnostic fully typed JavaScript client for the [ModDex](https://moddex.gg) API, the Minecraft mod and modpack review platform.

[![NPM Version](https://img.shields.io/npm/v/moddex-js)](https://www.npmjs.com/package/moddex-js)
[![NPM Downloads](https://img.shields.io/npm/dt/moddex-js)](https://www.npmjs.com/package/moddex-js)
[![GitHub Branch Check Runs](https://img.shields.io/github/check-runs/creeperkatze/moddex-js/main)](https://github.com/creeperkatze/moddex-js/actions)
[![Codecov](https://img.shields.io/codecov/c/github/creeperkatze/moddex-js)](https://codecov.io/github/creeperkatze/moddex-js)
[![GitHub Issues](https://img.shields.io/github/issues/creeperkatze/moddex-js)](https://github.com/creeperkatze/moddex-js/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/creeperkatze/moddex-js)](https://github.com/creeperkatze/moddex-js/pulls)
[![GitHub Repo stars](https://img.shields.io/github/stars/creeperkatze/moddex-js?style=flat)](https://github.com/creeperkatze/moddex-js/stargazers)

[📚 Docs](https://moddex-js.creeperkatze.dev/) •
[🚀 Getting Started](https://moddex-js.creeperkatze.dev/guide/getting-started) •
[📖 API Reference](https://moddex-js.creeperkatze.dev/api) •
[📝 Changelog](https://github.com/creeperkatze/moddex-js/releases)

## 📦 Installation

```sh
npm install moddex-js
pnpm add moddex-js
yarn add moddex-js
bun add moddex-js
```

## 🚀 Usage

```ts
import ModDexClient from 'moddex-js';

const client = new ModDexClient({ client: 'my-app/1.0.0' });

// Rating, links and the newest reviews of a Modrinth project, in one request.
const { data: reviews, meta } = await client.lookup.listReviews('modrinth', 'sodium', { per_page: 5 });

console.log(meta.project.rating.average, meta.project.links.web);
console.log(reviews);
```

The ModDex API is public, so no token is needed. Runs in Node 18+, browsers, and extension service workers. It uses the global `fetch` unless you pass your own.

## 🔢 Versions

| moddex-js | ModDex API |
|---|---|
| 2.x | v2 |
| 1.x | v1 (deprecated by ModDex) |

## 📖 API

### `new ModDexClient(options?)`

```ts
interface ModDexClientOptions {
  token?: string;                    // optional, only raises your rate limits
  client?: string;                   // "<name>/<version>", sent as X-Client
  baseUrl?: string;                  // default: "https://moddex.gg"
  timeoutMs?: number;                // default: 10000
  userAgent?: string;
  fetch?: typeof globalThis.fetch;   // default: globalThis.fetch, looked up per request
  cache?: boolean | CacheOptions;    // default: false
}
```

ModDex asks every client to identify itself, so set `client`.

### Methods

Lookup, from ModDex, CurseForge or Modrinth IDs, slugs, links and files:
- `client.lookup.get(platform, value, options?)`
- `client.lookup.find(options)`
- `client.lookup.listReviews(platform, value, options?)`
- `client.lookup.iterateReviews(platform, value, options?, paginateOptions?)`
- `client.lookup.batch(options)`
- `client.lookup.file(options)`
- `client.lookup.fileBatch(options)`

Projects, by ModDex project ID:
- `client.projects.list(options?)` / `iterate`
- `client.projects.get(id, options?)`
- `client.projects.listReviews(id, options?)` / `iterateReviews`
- `client.projects.listFiles(id, options?)` / `iterateFiles`
- `client.projects.listDependencies(id, options?)` / `iterateDependencies`
- `client.projects.listDependents(id, options?)` / `iterateDependents`
- `client.projects.listContents(id, options?)` / `iterateContents`
- `client.projects.listSimilar(id, options?)` / `iterateSimilar`
- `client.projects.getCommunityTags(id)`

Reviews:
- `client.reviews.list(options?)` / `iterate`
- `client.reviews.get(id, options?)`

Catalog vocabulary:
- `client.catalog.getFilters()`
- `client.catalog.listMinecraftVersions(options?)`
- `client.catalog.listLoaders()`
- `client.catalog.listTags(options?)`

Sync feeds:
- `client.sync.listProjects(options?)` / `iterateProjectPages`
- `client.sync.listReviews(options?)` / `iterateReviewPages`
- `client.sync.listReviewIds()`

User, needs a token:
- `client.user.get()`

Client:
- `client.rateLimit`
- `client.tokenExpiry`
- `client.clearCache()`

## 🔎 Lookup

ModDex lists projects from CurseForge and Modrinth, often both on one page. Lookup finds that page from any ID, slug or link:

```ts
const { data: project } = await client.lookup.get('curseforge', 394468);
const { data: fromLink } = await client.lookup.find({ url: 'https://modrinth.com/mod/sodium/versions' });

const { urls } = await client.lookup.batch({ urls: links.sort() }); // up to 100 values, one request
```

A CurseForge or ModDex slug can belong to a mod and a modpack at once. Without `type`, that throws `ModDexAmbiguousError` with both `candidates`. Links carry their type, so they're never ambiguous.

## 📄 Pagination

List methods return one page with `data`, `links`, and `meta`. To walk every page, use the `iterate*` helpers:

```ts
for await (const project of client.projects.iterate({ type: 'modpack', genres: ['tech'], per_page: 50 })) {
  console.log(project.name);
}
```

List filters take arrays. They are sent comma-separated, each value encoded on its own, as ModDex requires.

The sync feeds use cursors instead. Their iterators yield whole pages so you can store `meta.next_cursor`.

## ⏱️ Rate Limits

Without a token you get 60 requests a minute per IP, and 30 searches or filtered listings. With a token it's 300 and 120, per account. `client.rateLimit` holds the latest `X-RateLimit-*` values.

A `429` throws `ModDexRateLimitError` and a `503` (API busy) throws `ModDexServiceUnavailableError`, both with `retryAfter` in seconds. The `iterate*` helpers wait and retry the same page, up to 3 times by default. Single requests don't retry.

## 🗃️ Caching

ModDex responses are cacheable for 5 minutes, so a browser's HTTP cache already helps. For other runtimes, turn on the in-memory cache:

```ts
const client = new ModDexClient({ cache: { ttlMs: 5 * 60_000 } });

client.clearCache();
```

## ⚠️ Error Handling

Every failure throws a subclass of `ModDexError`. Every API error carries the stable `code` and, when ModDex has one, a `hint`:

| Class | When | Extra properties |
|---|---|---|
| `ModDexAuthenticationError` | `401` | |
| `ModDexForbiddenError` | `403` | |
| `ModDexNotFoundError` | `404` | |
| `ModDexConflictError` | `409` | `matches` |
| `ModDexValidationError` | `422` | `errors` |
| `ModDexAmbiguousError` | `422` with code `ambiguous` | `candidates` |
| `ModDexRateLimitError` | `429` | `retryAfter` |
| `ModDexServiceUnavailableError` | `503` | `retryAfter` |
| `ModDexTimeoutError` | Request exceeded `timeoutMs` | |
| `ModDexNetworkError` | No response received | |

```ts
import { ModDexError, ModDexNotFoundError } from 'moddex-js';

try {
  await client.lookup.get('modrinth', 'sodium');
} catch (error) {
  if (error instanceof ModDexNotFoundError) {
    console.error('Not on ModDex');
  } else if (error instanceof ModDexError) {
    console.error(error.status, error.code, error.message, error.hint);
  }
}
```

## 🛡️ Showing ModDex Content

- Only fields named `*_html` are HTML, and ModDex sanitizes them. Everything else is plain text: escape it.
- Review text is profanity-masked unless you pass `unmasked: true`.
- Credit ModDex where you show its ratings or reviews, with the words "Reviews from ModDex" linked to the project's `links.web`.
- If you store ModDex data, follow the sync feeds and remove content within 7 days of its removal from ModDex.

## 👨‍💻 Development

```sh
pnpm build

pnpm test
```

The live test suite in `tests/live` runs against moddex.gg and is skipped unless `MODDEX_LIVE=1` or `MODDEX_API_TOKEN` is set:

```sh
MODDEX_LIVE=1 pnpm test:live
```

## 🤝 Contributing

Contributions are always welcome!

Please ensure you run `pnpm lint:fix` before opening a pull request.

## 📜 License

MIT

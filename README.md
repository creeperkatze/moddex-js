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

const client = new ModDexClient({
  token: 'your-api-token',
  userAgent: 'my-app/1.0',
});

const mod = await client.mods.get('create');
const { data: reviews } = await client.mods.listReviews('create', { sort: 'helpful_votes' });

console.log(mod.average_rating);
console.log(reviews);
```

Runs in Node 18+, browsers, and extension service workers. It uses the global `fetch` unless you pass your own.

## 📖 API

### `new ModDexClient(options)`

```ts
const client = new ModDexClient({
  token: 'your-api-token',
  baseUrl: 'https://moddex.gg',
  timeoutMs: 10_000,
  userAgent: 'my-app/1.0',
  cache: { ttlMs: 60_000 },
});
```

### Options

```ts
interface ModDexClientOptions {
  token: string;                     // required
  baseUrl?: string;                  // default: "https://moddex.gg"
  timeoutMs?: number;                // default: 10000
  userAgent?: string;
  fetch?: typeof globalThis.fetch;   // default: globalThis.fetch, looked up per request
  cache?: boolean | CacheOptions;    // default: false
}
```

### Methods

User:
- `client.user.get()`

Projects:
- `client.projects.list(options?)`
- `client.projects.iterate(options?, paginateOptions?)`

Mods:
- `client.mods.get(slug)`
- `client.mods.listReviews(slug, options?)`
- `client.mods.iterateReviews(slug, options?, paginateOptions?)`

Modpacks:
- `client.modpacks.get(slug)`
- `client.modpacks.listReviews(slug, options?)`
- `client.modpacks.iterateReviews(slug, options?, paginateOptions?)`

Reviews:
- `client.reviews.get(id)`

Tags:
- `client.tags.list(options?)`
- `client.tags.iterate(options?, paginateOptions?)`

Client:
- `client.tokenExpiry`
- `client.clearCache()`

## 🔐 Authentication

Create a personal token on [moddex.gg](https://moddex.gg) under **Settings > API Tokens** and pass it to the client. It is sent as `Authorization: Bearer <token>` on every request.

Tokens expire after 90 days. The client reads the `X-ModDex-Token-Expires` header from each response and exposes it:

```ts
await client.user.get();

console.log(client.tokenExpiry?.expiresAt); // Date, or null if the header isn't a parseable date
console.log(client.tokenExpiry?.raw);       // header value as received
```

`client.tokenExpiry` is `null` until a response carrying the header arrives.

## 📄 Pagination

List methods return one page with `data`, `links`, and `meta`. Use `page` and `per_page` to choose a page. `per_page` defaults to 15 and goes up to 50, except tags, where it defaults to 50 and goes up to 100.

To walk every page, use the `iterate*` helpers:

```ts
for await (const project of client.projects.iterate({ type: 'modpack', per_page: 50 })) {
  console.log(project.name);
}
```

## ⏱️ Rate Limits

The API allows 60 requests per minute per user. A `429` response throws `ModDexRateLimitError` with `retryAfter` in seconds, taken from the `Retry-After` header.

The `iterate*` helpers wait for `Retry-After` and retry the same page, up to 3 times by default. Single requests don't retry.

## 🗃️ Caching

In-memory caching is off by default. Turn it on to serve repeated requests without using your rate limit:

```ts
const client = new ModDexClient({ token: 'your-api-token', cache: { ttlMs: 5 * 60_000 } });

client.clearCache();
```

## 🌐 Custom Fetch

You can inject your own `fetch` implementation.

```ts
const client = new ModDexClient({
  token: 'your-api-token',
  fetch: (input, init) => fetch(input, init),
});
```

Without one, the client calls `globalThis.fetch` at request time. It never binds fetch at import time.

## ⚠️ Error Handling

Every failure throws a subclass of `ModDexError`:

| Class | When | Extra properties |
|---|---|---|
| `ModDexAuthenticationError` | `401` | `code` (`token_missing`, `token_invalid`, `token_expired`), `hint` |
| `ModDexForbiddenError` | `403` | |
| `ModDexNotFoundError` | `404` | |
| `ModDexValidationError` | `422` | `errors` |
| `ModDexRateLimitError` | `429` | `retryAfter` |
| `ModDexTimeoutError` | Request exceeded `timeoutMs` | |
| `ModDexNetworkError` | No response received | |

```ts
import ModDexClient, { ModDexAuthenticationError, ModDexError, ModDexNotFoundError } from 'moddex-js';

try {
  await client.mods.get('create');
} catch (error) {
  if (error instanceof ModDexNotFoundError) {
    console.error('No mod with that slug');
  } else if (error instanceof ModDexAuthenticationError) {
    console.error(error.code, error.hint);
  } else if (error instanceof ModDexError) {
    console.error(error.status, error.message, error.body);
  }
}
```

## 🚧 Known Limits

- **Projects can only be fetched by ModDex slug.** There is no lookup by Modrinth or CurseForge id, and this client doesn't try to guess one.
- **Review authors only have `id` and `name`.** No username, avatar, or profile link, and no endpoint to fetch other users.
- **Read-only.** The API has no write endpoints.

## 👨‍💻 Development

```sh
pnpm build

pnpm test
```

The live test suite in `tests/live` runs against moddex.gg and is skipped unless `MODDEX_API_TOKEN` is set:

```sh
MODDEX_API_TOKEN=your-api-token pnpm test:live
```

## 🤝 Contributing

Contributions are always welcome!

Please ensure you run `pnpm lint:fix` before opening a pull request.

## 📜 License

MIT

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
  client: 'my-app/1.0.0',
});

const { data: project } = await client.lookup.get('modrinth', 'sodium');
const { data: reviews } = await client.projects.listReviews(project.id);

console.log(project.rating);
console.log(reviews);
```

## 📖 API

### `new ModDexClient(options?)`

```ts
const client = new ModDexClient({
  client: 'my-app/1.0.0',
  token: 'your-api-token',
  baseUrl: 'https://moddex.gg',
  timeoutMs: 10_000,
  cache: { ttlMs: 60_000 },
});
```

### Options

```ts
interface ModDexClientOptions {
  token?: string;
  client?: string;                   // sent as the X-Client header
  baseUrl?: string;                  // default: "https://moddex.gg"
  timeoutMs?: number;                // default: 10000
  userAgent?: string;
  fetch?: typeof globalThis.fetch;
  cache?: boolean | CacheOptions;    // default: false
}
```

### Selected Methods

Lookup:
- `client.lookup.get(platform, value, options?)`
- `client.lookup.find(options)`
- `client.lookup.listReviews(platform, value, options?)`
- `client.lookup.batch(options)`
- `client.lookup.file(options)`
- `client.lookup.fileBatch(options)`

Projects:
- `client.projects.list(options?)`
- `client.projects.get(id, options?)`
- `client.projects.listReviews(id, options?)`
- `client.projects.listFiles(id, options?)`
- `client.projects.listDependencies(id, options?)`
- `client.projects.listDependents(id, options?)`
- `client.projects.listContents(id, options?)`
- `client.projects.listSimilar(id, options?)`
- `client.projects.getCommunityTags(id)`

Reviews:
- `client.reviews.list(options?)`
- `client.reviews.get(id, options?)`

Catalog:
- `client.catalog.getFilters()`
- `client.catalog.listMinecraftVersions(options?)`
- `client.catalog.listLoaders()`
- `client.catalog.listTags(options?)`

Sync:
- `client.sync.listProjects(options?)`
- `client.sync.listReviews(options?)`
- `client.sync.listReviewIds()`

User:
- `client.user.get()`

Every list method also has an `iterate*` helper that walks every page.

## 🔐 Authentication

The ModDex API is public, so a token is optional. It only raises your rate limits. Create one on [moddex.gg](https://moddex.gg) under **Settings > API Tokens**. It is sent as `Authorization: Bearer <token>` on every request.

```ts
const client = new ModDexClient({
  token: 'your-api-token',
});
```

## 🌐 Custom Fetch

You can inject your own `fetch` implementation.

```ts
import ModDexClient from 'moddex-js';
import fetch from 'node-fetch';

const client = new ModDexClient({
  fetch,
});
```

## ⚠️ Error Handling

All request, timeout, and API errors are thrown as `ModDexError` or one of its subclasses, such as `ModDexNotFoundError` or `ModDexRateLimitError`.

```ts
import ModDexClient, { ModDexError } from 'moddex-js';

const client = new ModDexClient();

try {
  await client.lookup.get('modrinth', 'sodium');
} catch (error) {
  if (error instanceof ModDexError) {
    console.error(error.status);
    console.error(error.code);
    console.error(error.message);
  }
}
```

## 👨‍💻 Development

```sh
pnpm build

pnpm test
```

## 🤝 Contributing

Contributions are always welcome!

Please ensure you run `pnpm lint:fix` before opening a pull request.

## 📜 License

MIT

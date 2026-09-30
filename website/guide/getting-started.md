# Getting Started

## Installation

::: code-group

```sh [npm]
npm install moddex-js
```

```sh [pnpm]
pnpm add moddex-js
```

```sh [yarn]
yarn add moddex-js
```

```sh [bun]
bun add moddex-js
```

:::

## Create an API token

Every request needs a personal API token. Create one on [moddex.gg](https://moddex.gg) under **Settings > API Tokens**. Tokens are read-only, expire after 90 days, and can be revoked at any time.

## Create a client

```ts
import ModDexClient from 'moddex-js';

const client = new ModDexClient({
  token: process.env.MODDEX_API_TOKEN!,
  userAgent: 'my-app/1.0',
});
```

## Fetch some data

```ts
const mod = await client.mods.get('create');
const modpack = await client.modpacks.get('rlcraft');

const { data: topRated } = await client.projects.list({
  sort: 'bayesian_rating',
  direction: 'desc',
});
```

Single resources are returned directly. List endpoints return the full page envelope with `data`, `links`, and `meta`.

## Common options

```ts
const client = new ModDexClient({
  token: 'your-api-token',
  baseUrl: 'https://moddex.gg',
  timeoutMs: 10_000,
  userAgent: 'my-app/1.0',
  cache: { ttlMs: 60_000 },
});
```

## Where to go next

- [Authentication](/guide/authentication) covers tokens and expiry
- [Error Handling](/guide/error-handling) lists every error class
- [Pagination & Rate Limits](/guide/pagination) shows how to walk every page
- [Known Limits](/guide/limitations) explains what the API cannot do
- [API Reference](/api/) has the generated docs for every type

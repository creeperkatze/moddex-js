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

If you are coming from 1.x, see [Migrating from 1.x](/guide/migrating).

## Create a client

The ModDex API is public, so you don't need a token. Identify your app with `client`, which is sent as the `X-Client` header.

```ts
import ModDexClient from 'moddex-js';

const client = new ModDexClient({ client: 'my-app/1.0.0' });
```

## Fetch some data

```ts
// A project by its Modrinth slug, CurseForge ID, ModDex slug, or a pasted link
const { data: sodium } = await client.lookup.get('modrinth', 'sodium');
const { data: fromLink } = await client.lookup.find({ url: 'https://www.curseforge.com/minecraft/modpacks/rlcraft' });

// Its reviews, with the rating and links in meta.project, in one request
const { data: reviews, meta } = await client.lookup.listReviews('modrinth', 'sodium');

// The catalog, as the website shows it
const { data: topTech } = await client.projects.list({ genres: ['tech'], sort: 'bayesian_rating' });
```

Single resources are returned directly. List endpoints return the full page envelope with `data`, `links`, and `meta`. Lookups also return `matched`, which says how the value matched.

## Common options

```ts
const client = new ModDexClient({
  client: 'my-app/1.0.0',
  token: process.env.MODDEX_API_TOKEN, // optional
  baseUrl: 'https://moddex.gg',
  timeoutMs: 10_000,
  cache: { ttlMs: 5 * 60_000 },
});
```

## Where to go next

- [Lookup](/guide/lookup) finds projects from CurseForge and Modrinth IDs, slugs, links and files
- [Pagination & Rate Limits](/guide/pagination) shows how to walk every page
- [Error Handling](/guide/error-handling) lists every error class
- [API Reference](/api/) has the generated docs for every type

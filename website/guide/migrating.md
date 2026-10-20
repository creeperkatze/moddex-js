# Migrating from 1.x

moddex-js 2.x talks to the ModDex API v2. ModDex deprecated v1, and switches it off six months after v2 becomes generally available. moddex-js 1.x keeps working until then.

## The client

A token is now optional, and only raises your rate limits. Identify your app with `client` instead:

```ts
// 1.x
const client = new ModDexClient({ token: 'your-api-token', userAgent: 'my-app/1.0' });

// 2.x
const client = new ModDexClient({ client: 'my-app/1.0.0' });
```

## Methods

| 1.x | 2.x |
|---|---|
| `client.mods.get(slug)` | `client.lookup.get('moddex', slug, { type: 'mod' })` |
| `client.modpacks.get(slug)` | `client.lookup.get('moddex', slug, { type: 'modpack' })` |
| `client.mods.listReviews(slug)` | `client.lookup.listReviews('moddex', slug, { type: 'mod' })` |
| `client.modpacks.listReviews(slug)` | `client.lookup.listReviews('moddex', slug, { type: 'modpack' })` |
| `client.projects.list()` | `client.projects.list()`, now sorted by `bayesian_rating` by default |
| `client.reviews.get(id)` | `client.reviews.get(id)` |
| `client.tags.list()` | `client.catalog.listTags()`, not paginated, and `dev_environment` is now `environment` |
| `client.user.get()` | `client.user.get()`, still needs a token |

Lookup also takes CurseForge and Modrinth IDs, slugs and links, which 1.x couldn't do. Single projects come back as `{ data, matched }`.

## Project fields

| 1.x | 2.x |
|---|---|
| `average_rating` (`0` when unrated) | `rating.average` (`null` when unrated) |
| `bayesian_rating` | `rating.bayesian` |
| `total_ratings` | `rating.count` |
| `total_reviews`, `written_reviews_count` | `rating.written_count` |
| `gameplay_rating`, `performance_rating`, `aesthetics_rating` | `ratings.categories.*` with `include: ['ratings']` (histograms) |
| `mod_loaders` (names) | `loaders` (`{ slug, name }`) |
| `genres`, `features`, `themes` (names) | `{ slug, name }` objects |
| `platform_urls.curseforge`, `.modrinth` | `curseforge.url`, `modrinth.url` |
| `curseforge.description` | `curseforge.description_html` with `include: ['description']` |
| `curseforge.authors` | `authors`, one credit list across both platforms |
| `curseforge_created_at` | `curseforge.created_at`, and `published_at` for the earliest date |
| `license` (a string) | `license.name`, `license.open_source`, `license.categories` |

## Review fields and options

| 1.x | 2.x |
|---|---|
| `content` (raw) | `content` (masked unless `unmasked: true`) and `content_html` |
| `gameplay_rating`, … | `categories.gameplay`, … |
| `author: { id, name }` | `author` with `username`, `avatar_url`, `profile_url`, `roles` and `reputation` |
| `project: { id, name, slug, type }` | `project`, the project summary with `rating` and `links` |
| `sort: 'created_at' \| 'rating' \| 'helpful_votes' \| 'unhelpful_votes'` and `direction` | `sort: 'newest' \| 'oldest' \| 'rating' \| 'helpful'` |
| `per_page` default 15 | `per_page` default 20 |

## Errors

Every error now has `code` and `hint`. `ModDexAuthenticationError`'s codes are `unauthenticated` and `token_expired`. New classes: `ModDexConflictError`, `ModDexAmbiguousError` and `ModDexServiceUnavailableError`. The iterators now also wait out `503` responses.

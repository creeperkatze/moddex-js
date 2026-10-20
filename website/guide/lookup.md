# Lookup

ModDex lists projects from CurseForge and Modrinth, often both under one page. Lookup finds that page, and its ModDex project ID, from any of these keys:

| Key | Example |
|---|---|
| `moddex_id` | `1234` |
| `moddex_slug` | `sodium` (old slugs still resolve) |
| `curseforge_id` | `394468` |
| `curseforge_slug` | `sodium` |
| `modrinth_id` | `AANobbMI` (8 characters, case-sensitive) |
| `modrinth_slug` | `sodium` |

Lookup resolves every project with a page on ModDex, including delisted ones (`available: false`). Nothing matching throws `ModDexNotFoundError`, which ModDex caches for 60 seconds.

## By platform and value

```ts
const { data: project, matched } = await client.lookup.get('modrinth', 'sodium');

matched.key; // 'modrinth_slug'
```

The value is auto-detected: an all-digit `moddex` or `curseforge` value, or an 8-character `modrinth` value, is tried as an ID first, then as a slug.

Add `include` for heavy blocks, as on [`projects.get`](/guide/projects#get-a-project):

```ts
const { data } = await client.lookup.get('curseforge', 394468, { include: ['ratings'] });
```

## Mod or modpack?

A CurseForge or ModDex slug can belong to a mod and a modpack at once. Without `type`, that throws `ModDexAmbiguousError` with both projects in `candidates`:

```ts
await client.lookup.get('curseforge', 'sodium', { type: 'mod' });
```

Modrinth slugs are unique, and links carry their type, so neither is ever ambiguous.

## Reviews in one request

`listReviews` returns a project's reviews with the project summary in `meta.project`. That's the rating, the links and the newest reviews in one request, which suits a browser extension:

```ts
const { data: reviews, meta } = await client.lookup.listReviews('modrinth', 'sodium', { per_page: 5 });

meta.project.rating.average;     // null when nobody has rated it
meta.project.links.write_review; // opens the review form on ModDex
```

It takes the same options as [`projects.listReviews`](/guide/reviews).

## By link or several keys

`find` takes a pasted ModDex, CurseForge or Modrinth link, with or without the scheme, `www.`, a trailing slash, query string or fragment. Sub-pages such as `/files` or `/versions` resolve to their project, so the current tab's URL works as it is:

```ts
const { data } = await client.lookup.find({ url: 'https://modrinth.com/mod/sodium/versions' });
```

It also takes any combination of the six keys. Each is resolved on its own, and `matched` reports each one. If they hit different projects, it throws `ModDexConflictError` with `matches`:

```ts
const { data, matched } = await client.lookup.find({ curseforge_id: 394468, modrinth_id: 'AANobbMI' });
matched.modrinth_id?.hit; // true
```

## Batches

`batch` looks up to 100 values up in one request, which counts as one request against your rate limit. A bad value doesn't fail the rest. Each maps to a project summary, `{ ambiguous: true, candidates }`, or `null`:

```ts
const links = [...document.querySelectorAll<HTMLAnchorElement>('a.project-card')].map((a) => a.href).sort();
const { urls } = await client.lookup.batch({ urls: links });

for (const [url, project] of Object.entries(urls)) {
  if (project && !('ambiguous' in project)) renderBadge(url, project.rating);
}
```

Sort the values so the same page hits the same cache entry.

## Files

Map a jar to its project: a Modrinth file by SHA1, or a CurseForge file by file ID. CurseForge jars can't be matched by their content.

```ts
const { file, project, secondary } = await client.lookup.file({ sha1 });

const { sha1: bySha1 } = await client.lookup.fileBatch({ sha1: hashes.slice(0, 100) });
```

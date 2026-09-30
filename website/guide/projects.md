# Projects

Projects are mods and modpacks. Mods and modpacks are fetched by their ModDex slug, the last part of their URL on moddex.gg.

## List projects

```ts
const { data: projects, meta } = await client.projects.list({
  type: 'mod',                  // 'mod' | 'modpack'
  sort: 'bayesian_rating',      // see below
  direction: 'desc',            // 'asc' | 'desc', default 'desc'
  featured: true,               // only editor picks
  per_page: 50,                 // max 50, default 15
  page: 1,
});
```

Sort fields: `name` (default), `average_rating`, `bayesian_rating`, `total_ratings`, `total_reviews`, `downloads_count`, `last_updated_at`.

`bayesian_rating` pulls projects with few reviews toward the site-wide average, so one 5-star review can't outrank a project with hundreds of reviews. `total_ratings` and `total_reviews` both sort by total ratings (quick ratings plus written reviews).

To walk every page, use `client.projects.iterate()`. See [Pagination](/guide/pagination).

## Get a mod or modpack

```ts
const mod = await client.mods.get('create');
const modpack = await client.modpacks.get('rlcraft');

mod.gameplay_rating;        // category ratings
mod.features;               // taxonomy tags
mod.platform_urls.source;   // external links
mod.curseforge.id;          // CurseForge project id
mod.curseforge.authors;     // [{ name, url }]
```

An unknown slug throws `ModDexNotFoundError`.

The detail response has more fields than the list response, such as category ratings, `features`, `themes`, `platform_urls`, and CurseForge data. The list response has `bayesian_rating`, which the detail response doesn't.

> [!NOTE]
> There is no lookup by CurseForge or Modrinth id. See [Known Limits](/guide/limitations).

# Projects

Projects are mods and modpacks, addressed by their ModDex project ID. To get the ID from a CurseForge or Modrinth ID, slug or link, use [Lookup](/guide/lookup).

Projects come in three shapes:

| Shape | Type | Where |
|---|---|---|
| Summary | `ProjectSummary` | Lookups, batches, reviews: `id`, `name`, `slug`, `type`, `logo_url`, `available`, `rating`, `links` |
| List | `ProjectListItem` | Project lists: the summary plus taxonomy, downloads, versions and counts |
| Full | `Project` | `projects.get` and lookups: everything, plus `include` blocks |

Ratings are in `rating`: `average` and `bayesian` are `null` (not `0`) when nobody has rated the project.

## List and search projects

`list` is the catalog as a guest sees it on the website, with every filter and sort it has:

```ts
const { data: projects, meta } = await client.projects.list({
  q: 'create addon',             // full-text search, 3 to 200 characters
  type: 'mod',
  loaders: ['fabric', 'quilt'],
  minecraft_versions: ['1.21.1'],
  genres: ['tech'],
  genres_exclude: ['magic'],
  min_rating: 4,
  sort: 'downloads_count',        // default 'bayesian_rating', or 'relevance' with q
  per_page: 50,                   // max 50, default 20
});
```

Filter values are slugs, and every slug in a response is a valid filter value, so "more like this" is one step. [`catalog.getFilters()`](/guide/catalog) lists every parameter and its valid values. A search or any filter counts against the lower search [rate limit](/guide/pagination#rate-limits).

To walk every page, use `client.projects.iterate()`.

## Get a project

```ts
const project = await client.projects.get(1234, { include: ['ratings', 'counts'] });

project.rating.average;           // mean rating, or null
project.ratings?.categories;      // with include: ratings, histograms per category
project.curseforge?.url;          // null when not on CurseForge
project.modrinth?.organization;   // the owning Modrinth organization
project.authors;                  // credits with each platform's URL and handle
project.sources;                  // every listing, including merged loader-specific ones
```

Heavy blocks are left out unless you ask for them:

| `include` | Adds |
|---|---|
| `description` | `curseforge.description_html`, `modrinth.description` and `modrinth.description_html` |
| `ratings` | `ratings`: histograms per star and per category, and ranks |
| `counts` | `counts.followers`, `counts.stacks`, `counts.library_entries` |
| `completion` | `avg_completion_hours`, for modpacks |

Only `*_html` fields are HTML. See [Showing ModDex Content](/guide/limitations).

## Files

The Files tab, one platform at a time. A Modrinth row is a version, with its primary file at the top level and its other files in `secondary_files`. A CurseForge row is a file with its server pack.

```ts
const { data: files, meta } = await client.projects.listFiles(1234, {
  platform: 'modrinth',            // default: the website's tab
  minecraft_version: '1.21.1',
  loader: 'fabric',
  include: ['changelog'],          // caps per_page at 10
});

meta.platforms; // platforms with files
```

## Dependencies, dependents and modpack contents

```ts
const deps = await client.projects.listDependencies(1234, { relation_type: 'required' });
deps.incompatible; // listed in full, not paginated

const packs = await client.projects.listDependents(1234, { type: 'modpack' });

const contents = await client.projects.listContents(5678); // a modpack's mods
```

A dependency ModDex doesn't have has `project: null` and only the name and platform ID the listing declared. Lists are read one platform at a time: pass `platform` to choose. `listContents` throws `ModDexNotFoundError` for a mod.

## Similar projects and community tags

```ts
const similar = await client.projects.listSimilar(1234);
if (!similar.computed) {
  // A new project: ModDex computes it within 15 minutes
}

const { active, proposed } = await client.projects.getCommunityTags(1234);
```

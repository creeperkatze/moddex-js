# Catalog

The catalog vocabulary is every value the [`projects.list`](/guide/projects#list-and-search-projects) filters take. ModDex caches it for an hour, so it's cheap to load once.

## Filters

`getFilters` describes every `projects.list` parameter: its type, whether it takes a list and how many values, its `_exclude` and any/all companions, and the valid values of small vocabularies. It also lists every sort and the paging limits. It's enough to build a filter panel:

```ts
const filters = await client.catalog.getFilters();

for (const parameter of filters.parameters) {
  console.log(parameter.name, parameter.type, parameter.list, parameter.values?.map((value) => value.slug));
}
```

## Tags

Genres, features, themes and environments. Not paginated.

```ts
const genres = await client.catalog.listTags({ type: 'genre' });

genres[0].slug; // what the `genres` filter takes
```

Features carry the `category` they're listed under.

## Loaders and Minecraft versions

```ts
const loaders = await client.catalog.listLoaders();
const releases = await client.catalog.listMinecraftVersions({ type: 'release' }); // newest first
```

Version groups such as `1.20`, which `minecraft_versions` takes with `mc_exact: false`, are in `getFilters().minecraft_version_groups`.

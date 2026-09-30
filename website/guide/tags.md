# Tags

Tags categorize projects. There are four types: `genre`, `feature`, `theme`, and `dev_environment`.

## List tags

```ts
const { data: genres } = await client.tags.list({ type: 'genre', per_page: 100 });
```

`per_page` defaults to 50 and goes up to 100. To get every tag, use `client.tags.iterate()`:

```ts
const allTags = [];
for await (const tag of client.tags.iterate({ per_page: 100 })) {
  allTags.push(tag);
}
```

Mod loaders and Minecraft versions are not tags. Read `mod_loaders` and `minecraft_versions` on project responses instead.

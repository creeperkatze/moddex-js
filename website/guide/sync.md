# Sync Feeds

The sync feeds list every change in order, for keeping your own copy of ModDex data up to date. They use a cursor instead of page numbers and only go forward.

## Projects

Each row is a live project in the list shape, including delisted ones (`available: false`), or a tombstone for a project that no longer resolves. Tell them apart by `removed`:

```ts
let cursor = await loadCursor(); // undefined on the first run

for await (const page of client.sync.iterateProjectPages({ cursor })) {
  for (const row of page.data) {
    if (row.removed) {
      await removeProjectAndItsReviews(row.id); // reason: 'deleted', or 'merged' into row.canonical_id
    } else {
      await upsertProject(row);
    }
  }
  cursor = page.meta.next_cursor;
}

await saveCursor(cursor);
```

The iterator stops when `meta.has_more` is `false`. The last page's `next_cursor` points just past the last row, so store it and pass it back later to poll for new changes. Pass `since` instead of `cursor` to start from a point in time.

Tag, loader and Minecraft version changes bring a project back into the feed. Ratings and download counts change often, so popular projects come round regularly.

## Reviews

Every public written review that changed, in order, in the review shape:

```ts
for await (const page of client.sync.iterateReviewPages({ since: startedAt })) {
  page.data.forEach(storeReview);
  cursor = page.meta.next_cursor;
}
```

A review reaches the feed 5 minutes after it changes.

## Removed reviews

The reviews feed has no tombstones. To find reviews that were removed, compare the ones you hold against `listReviewIds`, which lists every public review:

```ts
const live = new Set(await client.sync.listReviewIds());
for (const id of await storedReviewIds()) {
  if (!live.has(id)) await deleteReview(id);
}
```

## Cursors

Pass a cursor back exactly as you got it, to the same feed. An edited cursor, or one from the other feed, throws `ModDexValidationError` with code `invalid_cursor`: start over without it.

`listProjects` and `listReviews` return one page if you'd rather drive the cursor yourself, and `followCursor` walks any cursor feed with the same retry handling.

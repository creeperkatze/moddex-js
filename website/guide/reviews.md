# Reviews

Review lists include only approved, published reviews with written content. Quick ratings (stars without text) and pending or rejected reviews are left out.

## List reviews for a mod or modpack

```ts
const { data: reviews } = await client.mods.listReviews('create', {
  sort: 'helpful_votes',  // 'created_at' (default) | 'rating' | 'helpful_votes' | 'unhelpful_votes'
  direction: 'desc',
  per_page: 50,           // max 50, default 15
});

const { data: packReviews } = await client.modpacks.listReviews('rlcraft');
```

To walk every page, use `iterateReviews`:

```ts
for await (const review of client.modpacks.iterateReviews('rlcraft', { per_page: 50 })) {
  console.log(review.rating, review.title);
}
```

## Get a single review

```ts
const review = await client.reviews.get(1);
```

Pending or rejected reviews throw `ModDexNotFoundError`.

## What a review contains

- Ratings: `rating`, `gameplay_rating`, `performance_rating`, `aesthetics_rating`
- Context: `minecraft_version`, `playtime_hours`, `play_status`, and `pack_version` for modpacks
- Votes: `helpful_votes`, `unhelpful_votes`
- `author`: only `id` and `name`
- `project`: `id`, `name`, `slug`, and `type`

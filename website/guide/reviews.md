# Reviews

Review lists include approved, written reviews. Quick ratings (stars only) count toward a project's rating but aren't listed, except in `reviews.list` with `written_only: false`.

## List reviews for a project

By ModDex project ID, or by any platform value with [`lookup.listReviews`](/guide/lookup#reviews-in-one-request):

```ts
const { data: reviews } = await client.projects.listReviews(1234, {
  sort: 'helpful',                 // 'newest' (default) | 'oldest' | 'rating' | 'helpful'
  min_rating: 3,
  minecraft_versions: ['1.20'],    // 1.20 matches every 1.20.x
  play_statuses: ['completed'],
  media: 'with_images',
  has_developer_response: true,
  per_page: 50,                    // max 50, default 20
});
```

To walk every page, use `iterateReviews`:

```ts
for await (const review of client.projects.iterateReviews(1234, { per_page: 50 })) {
  console.log(review.rating, review.title);
}
```

## List reviews across projects

Every public review on ModDex, newest first, with the same filters plus these:

```ts
const { data: latest } = await client.reviews.list({
  project_ids: [1234, 5678],       // up to 50
  type: 'modpack',
  since: '2026-10-01',
});
```

A review held for moderation keeps its writing date when it's approved, so `since` can miss it. To act on every new review, follow the [reviews sync feed](/guide/sync).

## Get a single review

```ts
const review = await client.reviews.get(77);
```

Pending, rejected and deleted reviews, and reviews of a project that no longer has a page, throw `ModDexNotFoundError`.

## What a review contains

- Ratings: `rating`, and `categories.gameplay`, `.performance`, `.aesthetics` (each `null` when not rated)
- Text: `title`, `content` (the author's Markdown, plain text) and `content_html` (sanitized)
- Context: `minecraft_version`, `playtime_hours`, `completion_hours`, `play_status`, `pack_version`
- `images`, `helpful_votes`, `unhelpful_votes`, `is_verified_developer`, `public_moderator_note`
- `developer_response`: the developer's reply with its own `author`, or `null`
- `author`: `name`, `username`, `avatar_url`, `profile_url`, `roles` and `reputation`. `id` is `null` for a deleted account
- `project`: the project summary, with `rating` and `links`
- `url`: the review's page on ModDex

## Profanity masking

Review text is masked by default: each profane word becomes asterisks of the same length. Pass `unmasked: true` for the original text. Masking only depends on that option, so responses stay cacheable.

## Spoilers

Spoilers in `content_html` are wrapped in `<span data-spoiler>`. Hide them with CSS such as `[data-spoiler] { filter: blur(4px) }`.

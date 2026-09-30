# Pagination & Rate Limits

## Page envelopes

List methods return one page along with its links and metadata:

```ts
const { data, links, meta } = await client.projects.list({ page: 2, per_page: 50 });

meta.current_page; // 2
meta.last_page;    // e.g. 5
meta.total;        // e.g. 72
links.next;        // URL of the next page, or null on the last page
```

| Endpoint | Default `per_page` | Max `per_page` |
|---|---|---|
| `client.projects.list` | 15 | 50 |
| `client.mods.listReviews` / `client.modpacks.listReviews` | 15 | 50 |
| `client.tags.list` | 50 | 100 |

## Iterating every page

Each list endpoint has an iterator that fetches the next page only when the loop needs it:

```ts
for await (const project of client.projects.iterate({ type: 'mod', per_page: 50 })) {
  console.log(project.name);
}

for await (const review of client.mods.iterateReviews('create', { sort: 'helpful_votes' })) {
  console.log(review.title);
}

for await (const tag of client.tags.iterate({ type: 'genre', per_page: 100 })) {
  console.log(tag.name);
}
```

Use the maximum `per_page` to reduce the number of requests. Breaking out of the loop stops further requests.

## Rate limits

The API allows 60 requests per minute per user. Going over it returns `429 Too Many Requests` with a `Retry-After` header.

The iterators handle this for you. When a page gets a `429`, they wait for the `Retry-After` duration (or 60 seconds if the header is missing), then retry the same page. After 3 retries of one page they throw the `ModDexRateLimitError`. The second argument changes this and the starting page:

```ts
const reviews = client.modpacks.iterateReviews('rlcraft', { per_page: 50 }, {
  startPage: 3,
  maxRateLimitRetries: 5,
});
```

Single requests like `client.mods.get()` never retry. They throw `ModDexRateLimitError`, and you decide what to do with `retryAfter`.

## Custom pagination

`paginate` is the helper behind the iterators. Use it to walk any page-returning function with the same rate limit handling:

```ts
import { paginate } from 'moddex-js';

const featured = paginate((page) => client.projects.list({ featured: true, page, per_page: 50 }));

for await (const project of featured) {
  console.log(project.slug);
}
```

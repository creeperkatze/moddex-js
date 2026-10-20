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

Some lists add fields to `meta`, such as `meta.project` on `lookup.listReviews` and `meta.platforms` on `projects.listFiles`.

| Endpoint | Default `per_page` | Max `per_page` |
|---|---|---|
| `projects.list` | 20 | 50 |
| Review lists | 20 | 50 |
| `projects.listFiles` | 20 (10 with changelogs) | 50 (10 with changelogs) |
| `projects.listDependencies`, `listContents` | 20 | 100 |
| `projects.listDependents` | 20 | 50 |
| `projects.listSimilar` | 12 | 50 |

A list can be read up to 10,000 rows deep (`page × per_page`). Deeper pages throw `ModDexValidationError` with code `page_depth_exceeded`: narrow the query with filters instead.

## Iterating every page

Each list endpoint has an iterator that fetches the next page only when the loop needs it:

```ts
for await (const project of client.projects.iterate({ type: 'mod', loaders: ['fabric'], per_page: 50 })) {
  console.log(project.name);
}

for await (const review of client.lookup.iterateReviews('modrinth', 'sodium', { sort: 'helpful' })) {
  console.log(review.title);
}
```

Use the maximum `per_page` to reduce the number of requests. Breaking out of the loop stops further requests.

## Lists in parameters

Filters that take several values take arrays. The client sends them comma-separated with each value encoded on its own, which is what ModDex needs. It matters most for links in `lookup.batch`, where encoded commas would make the request fail.

```ts
await client.projects.list({ genres: ['tech', 'magic'], genres_mode: 'all' });
```

## Rate limits

| | Without a token | With a token |
|---|---|---|
| All requests, per minute | 60, per IP | 300, per account |
| Searches (`q`) and filtered `projects.list` requests | 30 | 120 |

Paging, sorting and `type` don't make a request a search. A batch lookup counts as one request. `client.rateLimit` holds the values of the latest `X-RateLimit-*` headers:

```ts
await client.projects.list();
client.rateLimit; // { limit: 60, remaining: 59, resetAt: Date }
```

Going over your limit throws `ModDexRateLimitError`. Separately, when the whole API is busy, expensive requests (searches, heavy `include` blocks, dependents, modpack contents) throw `ModDexServiceUnavailableError` whatever your own limit.

The iterators handle both. They wait for the `Retry-After` duration (or 60 seconds if the header is missing), then retry the same page. After 3 retries of one page they throw. The last argument changes this and the starting page:

```ts
const reviews = client.reviews.iterate({ type: 'modpack' }, { startPage: 3, maxRateLimitRetries: 5 });
```

Single requests never retry. They throw, and you decide what to do with `retryAfter`.

## Sync feeds

The [sync feeds](/guide/sync) use a cursor instead of page numbers. Their iterators yield whole pages so you can keep `meta.next_cursor`.

## Custom pagination

`paginate` and `followCursor` are the helpers behind the iterators. Use them to walk any page-returning function with the same retry handling:

```ts
import { paginate } from 'moddex-js';

const featured = paginate((page) => client.projects.list({ featured: true, page, per_page: 50 }));

for await (const project of featured) {
  console.log(project.slug);
}
```

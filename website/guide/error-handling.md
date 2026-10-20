# Error Handling

Every failure throws a subclass of `ModDexError`. Catch `ModDexError` to handle everything, or a subclass to react to one case.

## Error classes

| Class | When | Extra properties |
|---|---|---|
| `ModDexAuthenticationError` | `401`: the token is invalid or expired | |
| `ModDexForbiddenError` | `403`: your client is blocked, or the token can't be used | |
| `ModDexNotFoundError` | `404`: no such project, review or route, or a lookup that matched nothing | |
| `ModDexConflictError` | `409`: the keys of `lookup.find` match different projects | `matches` |
| `ModDexValidationError` | `422`: a parameter is invalid, the page is too deep, or a sync cursor was edited | `errors` |
| `ModDexAmbiguousError` | `422`: a slug belongs to a mod and a modpack, and no `type` was given | `candidates` |
| `ModDexRateLimitError` | `429`: over your rate limit | `retryAfter` |
| `ModDexServiceUnavailableError` | `503`: the API is busy or search is down | `retryAfter` |
| `ModDexTimeoutError` | No response within `timeoutMs` | |
| `ModDexNetworkError` | The request failed before a response arrived (DNS, connection, CORS) | |
| `ModDexError` | Any other status, or a success response that isn't JSON | |

`ModDexAmbiguousError` extends `ModDexValidationError`.

## Common properties

| Property | Type | Description |
|---|---|---|
| `message` | `string` | The API's `message`, or `HTTP <status>` |
| `status` | `number` | HTTP status code, or `0` if no response was received |
| `code` | `string \| null` | The stable error code, such as `not_found` or `page_depth_exceeded`. Branch on this rather than on `message` |
| `hint` | `string \| null` | What to change, when ModDex has a suggestion |
| `body` | `unknown` | The parsed response body, if any |
| `response` | `Response \| undefined` | The raw fetch `Response`, if any |
| `cause` | `unknown` | The underlying error for timeouts and network failures |

## Example

```ts
import ModDexClient, {
  ModDexAmbiguousError,
  ModDexError,
  ModDexNotFoundError,
  ModDexRateLimitError,
  ModDexValidationError,
} from 'moddex-js';

try {
  await client.lookup.get('curseforge', 'sodium');
} catch (err) {
  if (err instanceof ModDexNotFoundError) {
    // Not on ModDex
  } else if (err instanceof ModDexAmbiguousError) {
    console.error(err.candidates.map((project) => project.type)); // ['mod', 'modpack']
  } else if (err instanceof ModDexRateLimitError) {
    console.error(`Rate limited, retry in ${err.retryAfter ?? 60}s`);
  } else if (err instanceof ModDexValidationError) {
    console.error(err.code, err.errors); // "validation_failed", { per_page: ['...'] }
  } else if (err instanceof ModDexError) {
    console.error(err.status, err.code, err.message);
  } else {
    throw err;
  }
}
```

## Validation errors

`errors` maps each invalid parameter to its messages. An unknown filter value lists the valid ones:

```ts
try {
  await client.projects.list({ genres: ['techh'] });
} catch (err) {
  if (err instanceof ModDexValidationError) {
    for (const [field, messages] of Object.entries(err.errors)) {
      console.error(field, messages.join(' '));
    }
  }
}
```

`errors` is empty for `page_depth_exceeded` (more than 10,000 rows into a list) and `invalid_cursor`.

## Rate limit and availability errors

`retryAfter` is the number of seconds from the `Retry-After` header, or `null` if the header was missing. The `iterate*` helpers already wait and retry for you, see [Pagination & Rate Limits](/guide/pagination).

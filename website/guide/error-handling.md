# Error Handling

Every failure throws a subclass of `ModDexError`. Catch `ModDexError` to handle everything, or a subclass to react to one case.

## Error classes

| Class | When | Extra properties |
|---|---|---|
| `ModDexAuthenticationError` | `401`: token missing, invalid, or expired | `code`, `hint` |
| `ModDexForbiddenError` | `403`: token lacks the read ability, or email not verified | |
| `ModDexNotFoundError` | `404`: unknown slug, or a review that isn't approved | |
| `ModDexValidationError` | `422`: a query parameter failed validation | `errors` |
| `ModDexRateLimitError` | `429`: more than 60 requests per minute | `retryAfter` |
| `ModDexTimeoutError` | No response within `timeoutMs` | |
| `ModDexNetworkError` | The request failed before a response arrived (DNS, connection, CORS) | |
| `ModDexError` | Any other status, or a success response that isn't JSON | |

## Common properties

| Property | Type | Description |
|---|---|---|
| `message` | `string` | The API's `message`, or `HTTP <status>` |
| `status` | `number` | HTTP status code, or `0` if no response was received |
| `body` | `unknown` | The parsed response body, if any |
| `response` | `Response \| undefined` | The raw fetch `Response`, if any |
| `cause` | `unknown` | The underlying error for timeouts and network failures |

## Example

```ts
import ModDexClient, {
  ModDexAuthenticationError,
  ModDexError,
  ModDexNotFoundError,
  ModDexRateLimitError,
  ModDexValidationError,
} from 'moddex-js';

try {
  await client.mods.get('create');
} catch (err) {
  if (err instanceof ModDexNotFoundError) {
    // No project with that slug
  } else if (err instanceof ModDexAuthenticationError) {
    console.error(err.code, err.hint); // e.g. "token_expired"
  } else if (err instanceof ModDexRateLimitError) {
    console.error(`Rate limited, retry in ${err.retryAfter ?? 60}s`);
  } else if (err instanceof ModDexValidationError) {
    console.error(err.errors); // { per_page: ['...'] }
  } else if (err instanceof ModDexError) {
    console.error(err.status, err.message);
  } else {
    throw err;
  }
}
```

## Validation errors

`errors` maps each invalid field to its messages, following Laravel's format:

```ts
try {
  await client.projects.list({ per_page: 500 });
} catch (err) {
  if (err instanceof ModDexValidationError) {
    for (const [field, messages] of Object.entries(err.errors)) {
      console.error(field, messages.join(' '));
    }
  }
}
```

## Rate limit errors

`retryAfter` is the number of seconds from the `Retry-After` header, or `null` if the header was missing. The `iterate*` helpers already wait and retry for you, see [Pagination & Rate Limits](/guide/pagination).

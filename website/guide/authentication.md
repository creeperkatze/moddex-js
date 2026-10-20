# Authentication

## Do you need a token?

No. Every v2 endpoint is public, and responses are the same with or without a token. A token only raises your [rate limits](/guide/pagination#rate-limits):

| | Without a token | With a token |
|---|---|---|
| All requests, per minute | 60, per IP | 300, per account |
| Searches and filtered listings, per minute | 30 | 120 |

## Using a token

Create a token on [moddex.gg](https://moddex.gg) under **Settings > API Tokens** and pass it to the client. It is sent as `Authorization: Bearer <token>` on every request.

```ts
const client = new ModDexClient({ client: 'my-bot/1.0.0', token: process.env.MODDEX_API_TOKEN });
```

The constructor throws a `TypeError` for an empty token. Leave `token` out instead.

> [!WARNING]
> Anyone who can read your code can read the token. Keep it on a server. Don't put it in a browser extension or a web page: they work without one.

## Token expiry

Tokens expire 90 days after they are created. Responses to requests with a token include an `X-ModDex-Token-Expires` header, which the client exposes as `client.tokenExpiry`:

```ts
await client.user.get();

const expiry = client.tokenExpiry;
if (expiry?.expiresAt) {
  const daysLeft = (expiry.expiresAt.getTime() - Date.now()) / 86_400_000;
  if (daysLeft < 7) console.warn(`ModDex token expires in ${Math.ceil(daysLeft)} days`);
}
```

| Property | Type | Description |
|---|---|---|
| `raw` | `string` | The header value exactly as received |
| `expiresAt` | `Date \| null` | The parsed date, or `null` if the value isn't a parseable date |

`client.tokenExpiry` is `null` until the first response that carries the header, and it keeps the last value seen. Responses served from the [cache](/guide/caching) don't update it.

## Authentication errors

A token that doesn't work throws `ModDexAuthenticationError`. ModDex never quietly falls back to guest access. Its `code` tells you why:

| `code` | Meaning |
|---|---|
| `unauthenticated` | The token is unknown, malformed or revoked |
| `token_expired` | The token is past its 90 days |
| `token_missing` | Only from `client.user.get()`: no token was sent |

```ts
import { ModDexAuthenticationError } from 'moddex-js';

try {
  await client.user.get();
} catch (err) {
  if (err instanceof ModDexAuthenticationError && err.code === 'token_expired') {
    console.error('Your ModDex token expired.', err.hint);
  }
}
```

A `403` throws `ModDexForbiddenError`: your client is blocked, or the token can't be used because it lacks the read ability or the account isn't verified.

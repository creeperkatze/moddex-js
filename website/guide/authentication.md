# Authentication

## Tokens

Pass your personal API token when creating the client. It is sent as `Authorization: Bearer <token>` on every request.

```ts
const client = new ModDexClient({ token: 'your-api-token' });
```

The constructor throws a `TypeError` if the token is missing or empty.

> [!WARNING]
> A token grants read access as you. Don't ship it in a public website's client-side code. Browser extensions and local tools that use the user's own token are fine.

## Token expiry

Tokens expire 90 days after they are created. Successful responses include an `X-ModDex-Token-Expires` header, which the client exposes as `client.tokenExpiry`:

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

> [!NOTE]
> In browsers, JavaScript can only read this header if the API exposes it through CORS (`Access-Control-Expose-Headers`). If it doesn't, `tokenExpiry` stays `null`.

## Authentication errors

A `401` response throws `ModDexAuthenticationError`. Its `code` tells you why:

| `code` | Meaning |
|---|---|
| `token_missing` | No token was sent |
| `token_invalid` | The token is wrong or was revoked |
| `token_expired` | The token is past its 90 days |

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

`code` and `hint` are `null` if the API didn't include them.

A `403` response throws `ModDexForbiddenError`. This happens when the token lacks the read ability or the account's email address isn't verified.

# User

## Get the authenticated user

Returns the profile of the user that owns the API token. This is the one endpoint that needs a [token](/guide/authentication).

```ts
const user = await client.user.get();

user.username;
user.rank;                  // reputation rank, e.g. "contributor"
user.social_links.github;
user.library_is_public;
```

It is the way to check that a token works and to read its expiry from [`client.tokenExpiry`](/guide/authentication#token-expiry). Without a token it throws `ModDexAuthenticationError` with code `token_missing`.

Other users' public details come with their reviews, in `review.author`.

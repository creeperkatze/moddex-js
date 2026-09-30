# User

## Get the authenticated user

Returns the profile of the user that owns the API token.

```ts
const user = await client.user.get();

user.username;
user.rank;                  // reputation rank, e.g. "contributor"
user.social_links.github;
user.library_is_public;
```

This is a cheap way to check that a token works and to read its expiry from [`client.tokenExpiry`](/guide/authentication#token-expiry).

There is no endpoint for other users' profiles. Review authors only include `id` and `name`.

# Known Limits

These come from the ModDex API itself, not from this client.

## Projects can only be fetched by ModDex slug

`client.mods.get()` and `client.modpacks.get()` take the ModDex slug. There is no lookup by CurseForge project id or Modrinth id, and the client doesn't try to guess one.

A project's CurseForge id is available after you have fetched it (`project.curseforge.id`), but you can't go the other way.

## Review authors only have an id and a name

`review.author` contains `id` and `name` and nothing else: no username, avatar, or profile link. There is no endpoint to fetch another user's profile.

## Read-only

The API has no endpoints for writing reviews, rating projects, or changing anything else.

## Rate limit

60 requests per minute. The limit is per user, not per token. See [Pagination & Rate Limits](/guide/pagination).

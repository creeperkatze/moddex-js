# Showing ModDex Content

These come from the ModDex API and its terms, not from this client.

## Escape plain text

Only fields named `*_html` are HTML, and ModDex sanitizes them: no scripts or event handlers, no `id` or `class` attributes, and every link is absolute. Everything else is plain text, so escape it before rendering. That includes names, review titles, review `content` (the author's Markdown) and `modrinth.description` (render `description_html` instead).

On a page you don't control, such as a browser extension on Modrinth or CurseForge, put ModDex HTML inside a Shadow DOM or a sandboxed iframe, so the host page's styles and scripts can't reach it.

## Masked review text

Review text is profanity-masked by default. Pass `unmasked: true` for the original. See [Reviews](/guide/reviews#profanity-masking).

## Credit ModDex

Where you show ModDex ratings or reviews, credit ModDex with the words "Reviews from ModDex", linked to the project's `links.web`. Add `?ref=<your-app>` to links back to ModDex so it can see which integrations send readers. Point "Write a review" buttons at `links.write_review`.

## Storing data

The API is built for showing ModDex data next to your own, not for copying the catalog. If you store data for longer than the HTTP cache keeps it, remove it within 7 days of its removal from ModDex. See [Sync Feeds](/guide/sync#removing-content).

## Read-only and non-commercial

The API has no endpoints for writing reviews, rating projects, or changing anything else. Its terms allow personal and non-commercial use only.

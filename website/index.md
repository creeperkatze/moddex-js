---
layout: home

hero:
  name: moddex-js
  tagline: A framework-agnostic fully typed JavaScript client for the ModDex API.
  actions:
    - theme: brand
      text: Getting Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/creeperkatze/moddex-js
    - theme: alt
      text: npm
      link: https://www.npmjs.com/package/moddex-js

features:
  - title: Full API v2 coverage
    details: Covers lookup, projects, files, dependencies, reviews, the catalog vocabulary, and the sync feeds.
  - title: No token needed
    details: The ModDex API is public. A token only raises your rate limits.
  - title: Typed errors
    details: Separate error classes for not found, ambiguous lookups, conflicts, validation, and rate limits, each with the stable error code.
  - title: Pagination built in
    details: Iterate every page or follow a sync cursor with a for await loop that waits out rate limits for you.
  - title: Runs anywhere
    details: Works in Node, browsers, and extension service workers using the global fetch, or one you pass in.
---

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
  - title: Full API coverage
    details: Covers projects, mods, modpacks, reviews, tags, and the authenticated user.
  - title: Typed errors
    details: Separate error classes for authentication, not found, validation, and rate limits, each with the details you need to react.
  - title: Pagination built in
    details: Iterate every page with a for await loop that waits out rate limits for you.
  - title: Runs anywhere
    details: Works in Node, browsers, and extension service workers using the global fetch, or one you pass in.
---

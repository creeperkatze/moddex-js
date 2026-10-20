import { version } from "../../package.json";
import { defineDocsConfig } from "./shared/docs";

export default defineDocsConfig({
  name: "moddex-js",
  description: "A framework-agnostic fully typed JavaScript client for the ModDex API.",
  repo: "creeperkatze/moddex-js",
  version,
  guide: [
    { text: "Getting Started", link: "/guide/getting-started" },
    { text: "Migrating from 1.x", link: "/guide/migrating" },
    { text: "Authentication", link: "/guide/authentication" },
    { text: "Error Handling", link: "/guide/error-handling" },
    { text: "Pagination & Rate Limits", link: "/guide/pagination" },
    { text: "Caching", link: "/guide/caching" },
    { text: "Runtimes & Custom Fetch", link: "/guide/custom-fetch" },
    { text: "Lookup", link: "/guide/lookup" },
    { text: "Projects", link: "/guide/projects" },
    { text: "Reviews", link: "/guide/reviews" },
    { text: "Catalog", link: "/guide/catalog" },
    { text: "Sync Feeds", link: "/guide/sync" },
    { text: "User", link: "/guide/user" },
    { text: "Showing ModDex Content", link: "/guide/limitations" },
  ],
  api: new URL("../api", import.meta.url),
});

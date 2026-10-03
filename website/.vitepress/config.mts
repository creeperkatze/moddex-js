import { version } from "../../package.json";
import { defineDocsConfig } from "./shared/docs";

export default defineDocsConfig({
  name: "moddex-js",
  description: "A framework-agnostic fully typed JavaScript client for the ModDex API.",
  repo: "creeperkatze/moddex-js",
  version,
  guide: [
    { text: "Getting Started", link: "/guide/getting-started" },
    { text: "Authentication", link: "/guide/authentication" },
    { text: "Error Handling", link: "/guide/error-handling" },
    { text: "Pagination & Rate Limits", link: "/guide/pagination" },
    { text: "Caching", link: "/guide/caching" },
    { text: "Runtimes & Custom Fetch", link: "/guide/custom-fetch" },
    { text: "Projects", link: "/guide/projects" },
    { text: "Reviews", link: "/guide/reviews" },
    { text: "Tags", link: "/guide/tags" },
    { text: "User", link: "/guide/user" },
    { text: "Known Limits", link: "/guide/limitations" },
  ],
  api: new URL("../api", import.meta.url),
});

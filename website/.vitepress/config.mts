import fs from "node:fs";
import path from "node:path";

import svgLoader from "vite-svg-loader";
import { defineConfig } from "vitepress";
import { version } from "../../package.json";

function normalizeBase(base: string): string {
  if (!base) return "/";

  const withLeadingSlash = base.startsWith("/") ? base : `/${base}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

interface SidebarItem {
  text: string;
  link: string;
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readApiItems(section: string): SidebarItem[] {
  const sectionDir = path.resolve(process.cwd(), "website", "api", section);
  if (!fs.existsSync(sectionDir)) {
    return [];
  }

  return fs
    .readdirSync(sectionDir)
    .filter((file) => file.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      return {
        text: titleFromSlug(slug),
        link: `/api/${section}/${slug}`,
      };
    });
}

const apiSidebar = [
  {
    text: "API Reference",
    items: [{ text: "Overview", link: "/api/" }],
  },
  {
    text: "Classes",
    collapsed: false,
    items: readApiItems("classes"),
  },
  {
    text: "Functions",
    collapsed: true,
    items: readApiItems("functions"),
  },
  {
    text: "Interfaces",
    collapsed: true,
    items: readApiItems("interfaces"),
  },
  {
    text: "Type Aliases",
    collapsed: true,
    items: readApiItems("type-aliases"),
  },
];

const guideSidebar = [
  {
    text: "Guide",
    items: [
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
  },
];

const base = normalizeBase(process.env.WEBSITE_BASE ?? "/");

export default defineConfig({
  vite: {
    plugins: [svgLoader()],
  },
  title: "moddex-js",
  description: "A framework-agnostic fully typed JavaScript client for the ModDex API.",
  base,
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api/" },
      {
        text: `v${version}`,
        items: [
          {
            text: "Changelog",
            link: "https://github.com/creeperkatze/moddex-js/releases",
          },
        ],
      },
    ],
    sidebar: {
      "/guide/": guideSidebar,
      "/api/": apiSidebar,
      "/": [...guideSidebar, ...apiSidebar],
    },
    lastUpdated: {},
    editLink: {
      pattern: "https://github.com/creeperkatze/moddex-js/edit/main/website/:path",
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/creeperkatze/moddex-js" },
      { icon: "npm", link: "https://www.npmjs.com/package/moddex-js" },
    ],
    search: {
      provider: "local",
    },
  },
});

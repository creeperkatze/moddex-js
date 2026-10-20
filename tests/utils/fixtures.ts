import type {
  AuthenticatedUser,
  Dependency,
  ModDexPaginatedResponse,
  Project,
  ProjectFile,
  ProjectListItem,
  ProjectSummary,
  Review,
  SyncResponse,
  Tag,
} from '../../src/types/index.js';

// Fixtures mirror the v2 examples in the API documentation at https://moddex.gg/api/docs.

export const MOCK_USER: AuthenticatedUser = {
  id: 1,
  name: 'Steve',
  username: 'steve',
  email: 'steve@example.com',
  email_verified_at: '2026-01-15T12:00:00+00:00',
  bio: 'Minecraft mod enthusiast.',
  avatar_url: 'https://moddex.gg/storage/avatars/1.png',
  rank: 'contributor',
  social_links: {
    curseforge: null,
    modrinth: 'https://modrinth.com/user/steve',
    github: 'https://github.com/steve',
    discord_username: 'steve#0001',
    discord_server: null,
    reddit: null,
    x: null,
    bluesky: null,
  },
  library_is_public: true,
  follows_is_public: false,
  user_directory_is_public: true,
  two_factor_enabled: false,
  created_at: '2025-06-01T00:00:00+00:00',
};

export const MOCK_PROJECT_SUMMARY: ProjectSummary = {
  id: 1234,
  name: 'Sodium',
  slug: 'sodium',
  type: 'mod',
  logo_url: 'https://cdn.modrinth.com/data/AANobbMI/icon.png',
  available: true,
  rating: { average: 4.8, bayesian: 4.6, count: 52, written_count: 31 },
  links: {
    web: 'https://moddex.gg/mod/sodium',
    reviews: 'https://moddex.gg/mod/sodium#reviews',
    write_review: 'https://moddex.gg/mod/sodium#review-form',
    badge: 'https://moddex.gg/badges/projects/sodium/rating.svg?type=mod',
  },
};

export const MOCK_PROJECT_LIST_ITEM: ProjectListItem = {
  ...MOCK_PROJECT_SUMMARY,
  summary: 'A modern rendering engine for Minecraft.',
  downloads_count: 98000000,
  last_updated_at: '2026-09-30T12:00:00Z',
  published_at: '2020-01-07T00:00:00Z',
  curseforge: { id: 394468, slug: 'sodium', url: 'https://www.curseforge.com/minecraft/mc-mods/sodium' },
  modrinth: { id: 'AANobbMI', slug: 'sodium', url: 'https://modrinth.com/mod/sodium' },
  minecraft_versions: ['1.21.1', '1.20.1'],
  loaders: [
    { slug: 'fabric', name: 'Fabric' },
    { slug: 'neoforge', name: 'NeoForge' },
  ],
  genres: [{ slug: 'no-genre', name: 'No Genre' }],
  features: [{ slug: 'performance-optimization', name: 'Performance & Optimization' }],
  themes: [],
  environment: [{ slug: 'client-only', name: 'Client Only' }],
  client_side: 'required',
  server_side: 'unsupported',
  counts: { dependencies: 0, dependents: 4200, modpack_dependents: 3900 },
  featured: null,
};

export const MOCK_PROJECT: Project = {
  ...MOCK_PROJECT_LIST_ITEM,
  curseforge: {
    id: 394468,
    slug: 'sodium',
    url: 'https://www.curseforge.com/minecraft/mc-mods/sodium',
    downloads_count: 40000000,
    created_at: '2020-06-01T00:00:00Z',
    updated_at: '2026-09-30T12:00:00Z',
    delisted_at: null,
    screenshots: [],
  },
  modrinth: {
    id: 'AANobbMI',
    slug: 'sodium',
    url: 'https://modrinth.com/mod/sodium',
    downloads_count: 58000000,
    created_at: '2020-01-07T00:00:00Z',
    updated_at: '2026-09-29T08:00:00Z',
    delisted_at: null,
    screenshots: [],
    organization: {
      id: 'aBcD1234',
      slug: 'caffeinemc',
      name: 'CaffeineMC',
      url: 'https://modrinth.com/organization/caffeinemc',
      icon_url: null,
    },
  },
  license: { name: 'Polyform Shield License 1.0.0', open_source: false, categories: ['restrictive'] },
  latest_version: {
    curseforge: null,
    modrinth: {
      version_number: 'mc1.21.1-0.6.0',
      released_at: '2026-09-29T08:00:00Z',
      minecraft_versions: ['1.21.1'],
      loaders: ['fabric', 'neoforge'],
      release_type: 'release',
      url: 'https://modrinth.com/mod/sodium/version/abc12345',
    },
  },
  authors: [
    {
      name: 'jellysquid3',
      role: 'Owner',
      is_owner: true,
      is_organization: false,
      curseforge_url: null,
      modrinth_url: 'https://modrinth.com/user/jellysquid3',
      curseforge_handle: null,
      modrinth_handle: 'jellysquid3',
    },
  ],
  platform_urls: {
    source: 'https://github.com/CaffeineMC/sodium',
    issues: 'https://github.com/CaffeineMC/sodium/issues',
    wiki: null,
    discord: null,
  },
  sources: [
    {
      project_id: 1234,
      platform: 'modrinth',
      platform_id: 'AANobbMI',
      label: 'Sodium',
      loaders: [{ slug: 'fabric', name: 'Fabric' }],
      url: 'https://modrinth.com/mod/sodium',
      latest_file_url: null,
      downloads_count: 58000000,
      available: true,
      is_canonical: true,
      last_updated_at: '2026-09-29T08:00:00Z',
    },
  ],
  community_tags_count: 4,
};

export const MOCK_REVIEW: Review = {
  id: 77,
  is_quick_rating: false,
  title: 'Essential',
  content: 'Doubles my FPS.',
  content_html: '<p>Doubles my FPS.</p>\n',
  rating: 5,
  categories: { gameplay: null, performance: 5, aesthetics: null },
  minecraft_version: '1.21.1',
  playtime_hours: 120,
  completion_hours: null,
  play_status: 'playing',
  pack_version: null,
  helpful_votes: 3,
  unhelpful_votes: 0,
  is_verified_developer: false,
  public_moderator_note: null,
  images: [],
  developer_response: null,
  author: {
    id: 1,
    name: 'Steve',
    username: 'steve',
    avatar_url: null,
    profile_url: 'https://moddex.gg/user/steve',
    roles: [],
    reputation: { points: 120, tier: 'contributor', tier_label: 'Contributor' },
  },
  project: MOCK_PROJECT_SUMMARY,
  url: 'https://moddex.gg/mod/sodium/reviews/77',
  created_at: '2026-09-01T00:00:00Z',
  edited_at: null,
  updated_at: '2026-09-01T00:00:00Z',
};

export const MOCK_FILE: ProjectFile = {
  id: 9001,
  platform: 'modrinth',
  curseforge_file_id: null,
  modrinth_version_id: 'abc12345',
  sha1: 'f0e1d2c3b4a5968778695a4b3c2d1e0f12345678',
  display_name: 'Sodium 0.6.0',
  version_number: 'mc1.21.1-0.6.0',
  release_type: 'release',
  minecraft_versions: ['1.21.1'],
  loaders: ['fabric'],
  file_name: 'sodium-fabric-0.6.0+mc1.21.1.jar',
  file_size: 1048576,
  downloads_count: 250000,
  released_at: '2026-09-29T08:00:00Z',
  is_featured: true,
  download_url: 'https://modrinth.com/mod/sodium/version/abc12345',
  platform_url: 'https://modrinth.com/mod/sodium/version/abc12345',
  server_pack: null,
  secondary_files: [],
};

export const MOCK_DEPENDENCY: Dependency = {
  relation_type: 'required',
  name: 'Fabric API',
  curseforge_id: null,
  modrinth_id: 'P7dR8mSH',
  project: { ...MOCK_PROJECT_LIST_ITEM, id: 99, name: 'Fabric API', slug: 'fabric-api' },
};

export const MOCK_TAG: Tag = {
  slug: 'tech',
  name: 'Tech',
  type: 'genre',
  description: 'Machines and automation.',
  category: null,
};

/** Builds a paginated envelope for page `page` of `lastPage`. */
export function paginated<T>(data: T[], page = 1, lastPage = 1, perPage = 20): ModDexPaginatedResponse<T> {
  return {
    data,
    links: {
      first: 'https://moddex.gg/api/v2/example?page=1',
      last: `https://moddex.gg/api/v2/example?page=${lastPage}`,
      prev: page > 1 ? `https://moddex.gg/api/v2/example?page=${page - 1}` : null,
      next: page < lastPage ? `https://moddex.gg/api/v2/example?page=${page + 1}` : null,
    },
    meta: { current_page: page, last_page: lastPage, per_page: perPage, total: data.length * lastPage },
  };
}

/** Builds a sync feed page that continues at `nextCursor`. */
export function syncPage<T>(data: T[], nextCursor: string, hasMore: boolean): SyncResponse<T> {
  return {
    data,
    links: { next: hasMore ? `https://moddex.gg/api/v2/sync/example?cursor=${nextCursor}` : null, prev: null },
    meta: { per_page: 50, next_cursor: nextCursor, prev_cursor: null, has_more: hasMore },
  };
}

import type {
  AuthenticatedUser,
  ModDexPaginatedResponse,
  Project,
  ProjectSummary,
  Review,
  Tag,
} from '../../src/types/index.js';

// Fixtures mirror the examples in spec.yaml.

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
  id: 1,
  name: 'Create',
  slug: 'create',
  summary: 'Aesthetic Technology that empowers the Player',
  type: 'mod',
  logo_url: 'https://...',
  average_rating: 4.5,
  bayesian_rating: 4.2,
  total_ratings: 12,
  total_reviews: 8,
  written_reviews_count: 8,
  downloads_count: 500000,
  minecraft_versions: ['1.20.1', '1.21.1'],
  mod_loaders: ['Forge', 'NeoForge'],
  genres: ['Tech'],
  last_updated_at: '2026-03-15T00:00:00+00:00',
};

export const MOCK_MOD: Project = {
  id: 1,
  name: 'Create',
  slug: 'create',
  summary: 'Aesthetic Technology that empowers the Player',
  type: 'mod',
  logo_url: 'https://...',
  license: 'Create Mod License',
  average_rating: 4.5,
  gameplay_rating: 4.0,
  performance_rating: 4.5,
  aesthetics_rating: 5.0,
  total_ratings: 12,
  total_reviews: 8,
  written_reviews_count: 8,
  downloads_count: 500000,
  minecraft_versions: ['1.20.1', '1.21.1'],
  mod_loaders: ['Forge', 'NeoForge'],
  genres: ['Tech'],
  features: ['Automation & Processing', 'Building Improvements', 'Redstone Improvements'],
  themes: ['Industrial', 'Steampunk/Dieselpunk'],
  platform_urls: {
    curseforge: 'https://...',
    modrinth: null,
    source: null,
    issues: null,
    wiki: null,
    discord: null,
  },
  curseforge: {
    id: 328085,
    description: '<p>Full HTML description...</p>',
    authors: [{ name: 'simibubi', url: null }],
    screenshots: [],
    downloads_count: 500000,
    updated_at: '2026-03-15T00:00:00+00:00',
    created_at: '2023-01-01T00:00:00+00:00',
    delisted_at: null,
  },
  modrinth: null,
  last_updated_at: '2026-03-15T00:00:00+00:00',
  curseforge_created_at: '2023-01-01T00:00:00+00:00',
};

export const MOCK_MODPACK: Project = {
  ...MOCK_MOD,
  id: 42,
  name: 'RLCraft',
  slug: 'rlcraft',
  summary: 'A hardcore survival modpack.',
  type: 'modpack',
  license: 'All Rights Reserved',
};

export const MOCK_REVIEW: Review = {
  id: 1,
  is_quick_rating: false,
  title: 'Amazing mod!',
  content: 'This mod completely changed how I play Minecraft...',
  rating: 4.5,
  gameplay_rating: 4.0,
  performance_rating: 4.5,
  aesthetics_rating: 5.0,
  minecraft_version: '1.20.1',
  playtime_hours: 500,
  play_status: 'completed',
  pack_version: null,
  helpful_votes: 5,
  unhelpful_votes: 0,
  is_verified_developer: false,
  author: { id: 1, name: 'Steve' },
  project: { id: 1, name: 'Create', slug: 'create', type: 'mod' },
  created_at: '2026-03-01T00:00:00+00:00',
  edited_at: null,
  public_moderator_note: null,
};

export const MOCK_TAG: Tag = {
  id: 1,
  name: 'Technology',
  slug: 'technology',
  type: 'genre',
  description: 'Mods focused on technology and automation.',
};

/** Builds a paginated envelope for page `page` of `lastPage`. */
export function paginated<T>(data: T[], page = 1, lastPage = 1, perPage = 15): ModDexPaginatedResponse<T> {
  return {
    data,
    links: {
      first: 'https://moddex.gg/api/v1/example?page=1',
      last: `https://moddex.gg/api/v1/example?page=${lastPage}`,
      prev: page > 1 ? `https://moddex.gg/api/v1/example?page=${page - 1}` : null,
      next: page < lastPage ? `https://moddex.gg/api/v1/example?page=${page + 1}` : null,
    },
    meta: { current_page: page, last_page: lastPage, per_page: perPage, total: data.length * lastPage },
  };
}

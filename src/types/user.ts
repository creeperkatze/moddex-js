/** Social profile links of the authenticated user. */
export interface UserSocialLinks {
  curseforge: string | null;
  modrinth: string;
  github: string;
  discord_username: string;
  discord_server: string | null;
  reddit: string | null;
  x: string | null;
  bluesky: string | null;
}

/** The user that owns the API token, as returned by `GET /api/user`. */
export interface AuthenticatedUser {
  id: number;
  name: string;
  username: string;
  email: string;
  email_verified_at: string;
  bio: string;
  avatar_url: string;
  /** Reputation rank, e.g. `contributor`. */
  rank: string;
  social_links: UserSocialLinks;
  library_is_public: boolean;
  follows_is_public: boolean;
  user_directory_is_public: boolean;
  two_factor_enabled: boolean;
  created_at: string;
}

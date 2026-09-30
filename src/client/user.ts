import type { ModDexClientCore } from './core.js';
import type { AuthenticatedUser } from '../types/index.js';
import type { ModDexResponse } from '../types/base.js';

/** API namespace for the user that owns the API token. */
export class UserApi {
  constructor(private readonly core: ModDexClientCore) {}

  /** Returns the profile of the user that owns the API token. */
  async get(): Promise<AuthenticatedUser> {
    const response = await this.core.requestJson<ModDexResponse<AuthenticatedUser>>('api/user');
    return response.data;
  }
}

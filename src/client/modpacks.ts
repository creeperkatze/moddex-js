import type { ModDexClientCore } from './core.js';
import { ProjectKindApi } from './project-kind.js';

/**
 * API namespace for modpacks, looked up by ModDex slug.
 * @example
 * ```ts
 * const modpack = await client.modpacks.get('rlcraft');
 * const { data: reviews } = await client.modpacks.listReviews('rlcraft');
 * ```
 */
export class ModpacksApi extends ProjectKindApi {
  constructor(core: ModDexClientCore) {
    super(core, 'modpacks');
  }
}

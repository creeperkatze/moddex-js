import type { ModDexClientCore } from './core.js';
import { ProjectKindApi } from './project-kind.js';

/**
 * API namespace for mods, looked up by ModDex slug.
 * @example
 * ```ts
 * const mod = await client.mods.get('create');
 * const { data: reviews } = await client.mods.listReviews('create', { sort: 'helpful_votes' });
 * ```
 */
export class ModsApi extends ProjectKindApi {
  constructor(core: ModDexClientCore) {
    super(core, 'mods');
  }
}

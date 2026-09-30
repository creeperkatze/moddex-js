import type { ModDexClientCore } from './core.js';
import type { Review } from '../types/index.js';
import type { ModDexResponse } from '../types/base.js';

/** API namespace for individual reviews. */
export class ReviewsApi {
  constructor(private readonly core: ModDexClientCore) {}

  /** Returns a single approved review. Pending or rejected reviews throw {@link ModDexNotFoundError}. */
  async get(id: number): Promise<Review> {
    const response = await this.core.requestJson<ModDexResponse<Review>>(`api/v1/reviews/${encodeURIComponent(id)}`);
    return response.data;
  }
}

/**
 * Abstract base class for all services.
 *
 * Provides a common ancestor for all service classes.
 * Extend this to add shared service utilities (e.g., pagination helpers,
 * common query builders) as the application grows.
 */
export abstract class BaseService {
  protected buildPagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}

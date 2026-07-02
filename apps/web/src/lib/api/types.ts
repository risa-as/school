/** Mirrors `AuthTokens` returned by `apps/api`'s `POST /auth/login` and `POST /auth/refresh`. */
export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  /** JWT-style duration string, e.g. "15m" (see `apps/api`'s `JWT_ACCESS_EXPIRES_IN`). */
  expiresIn: string;
  user: {
    id: string;
    fullName: string;
    locale: string;
    membershipId: string;
    roleId: string;
    roleKey: string;
  };
}

/** Mirrors apps/api's `Paginated<T>` (`src/common/dto/pagination-query.dto.ts`). */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

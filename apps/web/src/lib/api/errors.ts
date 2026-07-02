/** Mirrors apps/api's `AllExceptionsFilter` response body exactly (docs/ARCHITECTURE.md). */
export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  errors: string[];
}

/** Thrown by `apiFetch` for any non-2xx response (after the refresh-and-retry flow, if applicable). */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly errors: string[];

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.code = body.code;
    this.errors = body.errors;
  }
}

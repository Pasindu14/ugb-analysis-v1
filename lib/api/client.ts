// ─────────────────────────────────────────────────────────────
// ApiError — thrown by the response interceptor for every non-2xx
// ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  /** Field errors flattened to Record<field, "msg1, msg2"> for form binding */
  public readonly fields?: Record<string, string>;
  public readonly detail?: string;
  public readonly currentData?: unknown;
  public readonly traceId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
    detail?: string,
    currentData?: unknown,
    traceId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.detail = detail;
    this.currentData = currentData;
    this.traceId = traceId;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

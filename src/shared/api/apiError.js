export class ApiError extends Error {
  constructor(message, { status, code, fieldErrors, cause } = {}) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  successResponse,
  errorResponse,
  ApiErrors,
  zodErrorToResponse,
  validateRequestBody,
  validateQueryParams,
  withErrorHandler,
} from "./handler";
import { ErrorCode } from "./response";

describe("successResponse", () => {
  it("should create success response with default status 200", async () => {
    const data = { id: 1, name: "Test" };
    const response = successResponse(data);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, data });
  });

  it("should create success response with custom status", async () => {
    const data = { id: 1 };
    const response = successResponse(data, 201);

    expect(response.status).toBe(201);
  });
});

describe("errorResponse", () => {
  it("should create error response without details", async () => {
    const response = errorResponse("NOT_FOUND", "Resource not found", 404);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Resource not found" },
    });
  });

  it("should create error response with details", async () => {
    const details = [{ field: "email", message: "Invalid email" }];
    const response = errorResponse("VALIDATION_ERROR", "Validation failed", 400, details);

    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });
});

describe("ApiErrors", () => {
  it("should create invalidCredentials error", async () => {
    const response = ApiErrors.invalidCredentials();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.INVALID_CREDENTIALS);
  });

  it("should create tokenExpired error", async () => {
    const response = ApiErrors.tokenExpired();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.TOKEN_EXPIRED);
  });

  it("should create forbidden error with default message", async () => {
    const response = ApiErrors.forbidden();
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("should create forbidden error with custom message", async () => {
    const response = ApiErrors.forbidden("カスタムメッセージ");
    const body = await response.json();
    expect(body.error.message).toBe("カスタムメッセージ");
  });

  it("should create notFound error", async () => {
    const response = ApiErrors.notFound("日報");
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.message).toBe("日報が見つかりません");
  });

  it("should create validationError with details", async () => {
    const details = [{ field: "name", message: "名前は必須です" }];
    const response = ApiErrors.validationError(details);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(body.error.details).toEqual(details);
  });

  it("should create duplicateReport error", async () => {
    const response = ApiErrors.duplicateReport();
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.DUPLICATE_REPORT);
  });

  it("should create duplicateEmail error", async () => {
    const response = ApiErrors.duplicateEmail();
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.DUPLICATE_EMAIL);
  });

  it("should create internalError", async () => {
    const response = ApiErrors.internalError();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.INTERNAL_ERROR);
  });
});

describe("zodErrorToResponse", () => {
  it("should convert ZodError to validation error response", async () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const result = schema.safeParse({ email: "invalid", password: "short" });
    expect(result.success).toBe(false);

    if (!result.success) {
      const response = zodErrorToResponse(result.error);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(body.error.details).toHaveLength(2);
    }
  });
});

describe("validateRequestBody", () => {
  const testSchema = z.object({
    name: z.string().min(1, "名前は必須です"),
    email: z.string().email("正しいメールアドレスを入力してください"),
  });

  it("should validate valid request body", async () => {
    const mockRequest = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "Test", email: "test@example.com" }),
    });

    const result = await validateRequestBody(mockRequest, testSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "Test", email: "test@example.com" });
    }
  });

  it("should return error for invalid request body", async () => {
    const mockRequest = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "", email: "invalid" }),
    });

    const result = await validateRequestBody(mockRequest, testSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });

  it("should return error for invalid JSON", async () => {
    const mockRequest = new Request("http://localhost/api/test", {
      method: "POST",
      body: "invalid json",
    });

    const result = await validateRequestBody(mockRequest, testSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });
});

describe("validateQueryParams", () => {
  const testSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    search: z.string().optional(),
  });

  it("should validate valid query params", () => {
    const searchParams = new URLSearchParams("page=2&search=test");
    const result = validateQueryParams(searchParams, testSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ page: 2, search: "test" });
    }
  });

  it("should use default values", () => {
    const searchParams = new URLSearchParams("");
    const result = validateQueryParams(searchParams, testSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it("should return error for invalid params", () => {
    const schema = z.object({
      page: z.coerce.number().int().positive(),
    });
    const searchParams = new URLSearchParams("page=-1");
    const result = validateQueryParams(searchParams, schema);
    expect(result.success).toBe(false);
  });
});

describe("withErrorHandler", () => {
  it("should return successful response", async () => {
    const handler = async () => successResponse({ id: 1 });
    const response = await withErrorHandler(handler);
    expect(response.status).toBe(200);
  });

  it("should catch errors and return internal error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const handler = async () => {
      throw new Error("Unexpected error");
    };
    const response = await withErrorHandler(handler);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCode.INTERNAL_ERROR);

    consoleSpy.mockRestore();
  });
});

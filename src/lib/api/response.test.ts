import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  ErrorCode,
  validationErrorDetailSchema,
  apiErrorSchema,
  successResponseSchema,
  errorResponseSchema,
  paginationSchema,
  paginatedDataSchema,
  paginationParamsSchema,
} from "./response";

describe("ErrorCode", () => {
  it("should have all expected error codes", () => {
    expect(ErrorCode.INVALID_CREDENTIALS).toBe("INVALID_CREDENTIALS");
    expect(ErrorCode.TOKEN_EXPIRED).toBe("TOKEN_EXPIRED");
    expect(ErrorCode.FORBIDDEN).toBe("FORBIDDEN");
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.DUPLICATE_REPORT).toBe("DUPLICATE_REPORT");
    expect(ErrorCode.DUPLICATE_EMAIL).toBe("DUPLICATE_EMAIL");
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
  });
});

describe("validationErrorDetailSchema", () => {
  it("should validate valid error detail", () => {
    const validDetail = { field: "email", message: "Invalid email" };
    const result = validationErrorDetailSchema.safeParse(validDetail);
    expect(result.success).toBe(true);
  });

  it("should reject invalid error detail", () => {
    const invalidDetail = { field: 123, message: "Invalid email" };
    const result = validationErrorDetailSchema.safeParse(invalidDetail);
    expect(result.success).toBe(false);
  });
});

describe("apiErrorSchema", () => {
  it("should validate error without details", () => {
    const error = { code: "NOT_FOUND", message: "Resource not found" };
    const result = apiErrorSchema.safeParse(error);
    expect(result.success).toBe(true);
  });

  it("should validate error with details", () => {
    const error = {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: [{ field: "email", message: "Invalid email" }],
    };
    const result = apiErrorSchema.safeParse(error);
    expect(result.success).toBe(true);
  });
});

describe("successResponseSchema", () => {
  it("should validate success response with data", () => {
    const dataSchema = z.object({ id: z.number(), name: z.string() });
    const schema = successResponseSchema(dataSchema);

    const response = { success: true, data: { id: 1, name: "Test" } };
    const result = schema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should reject when success is false", () => {
    const dataSchema = z.object({ id: z.number() });
    const schema = successResponseSchema(dataSchema);

    const response = { success: false, data: { id: 1 } };
    const result = schema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

describe("errorResponseSchema", () => {
  it("should validate error response", () => {
    const response = {
      success: false,
      error: { code: "NOT_FOUND", message: "Not found" },
    };
    const result = errorResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should reject when success is true", () => {
    const response = {
      success: true,
      error: { code: "NOT_FOUND", message: "Not found" },
    };
    const result = errorResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

describe("paginationSchema", () => {
  it("should validate valid pagination", () => {
    const pagination = {
      current_page: 1,
      per_page: 20,
      total_pages: 5,
      total_count: 100,
    };
    const result = paginationSchema.safeParse(pagination);
    expect(result.success).toBe(true);
  });

  it("should reject negative values", () => {
    const pagination = {
      current_page: -1,
      per_page: 20,
      total_pages: 5,
      total_count: 100,
    };
    const result = paginationSchema.safeParse(pagination);
    expect(result.success).toBe(false);
  });

  it("should allow zero for total_pages and total_count", () => {
    const pagination = {
      current_page: 1,
      per_page: 20,
      total_pages: 0,
      total_count: 0,
    };
    const result = paginationSchema.safeParse(pagination);
    expect(result.success).toBe(true);
  });
});

describe("paginatedDataSchema", () => {
  it("should validate paginated data", () => {
    const itemSchema = z.object({ id: z.number(), name: z.string() });
    const schema = paginatedDataSchema(itemSchema);

    const data = {
      items: [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_pages: 1,
        total_count: 2,
      },
    };
    const result = schema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should validate empty items array", () => {
    const itemSchema = z.object({ id: z.number() });
    const schema = paginatedDataSchema(itemSchema);

    const data = {
      items: [],
      pagination: {
        current_page: 1,
        per_page: 20,
        total_pages: 0,
        total_count: 0,
      },
    };
    const result = schema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe("paginationParamsSchema", () => {
  it("should use default values when not provided", () => {
    const result = paginationParamsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.per_page).toBe(20);
    }
  });

  it("should coerce string values to numbers", () => {
    const result = paginationParamsSchema.safeParse({ page: "2", per_page: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.per_page).toBe(50);
    }
  });

  it("should reject per_page over 100", () => {
    const result = paginationParamsSchema.safeParse({ per_page: "150" });
    expect(result.success).toBe(false);
  });

  it("should reject non-positive page values", () => {
    const result = paginationParamsSchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });
});

import { z } from "zod";

// エラーコード定義
export const ErrorCode = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DUPLICATE_REPORT: "DUPLICATE_REPORT",
  DUPLICATE_EMAIL: "DUPLICATE_EMAIL",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// バリデーションエラー詳細のスキーマ
export const validationErrorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export type ValidationErrorDetail = z.infer<typeof validationErrorDetailSchema>;

// エラー情報のスキーマ
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(validationErrorDetailSchema).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// 成功レスポンスのスキーマ（ジェネリック）
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export type SuccessResponse<T> = {
  success: true;
  data: T;
};

// エラーレスポンスのスキーマ
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: apiErrorSchema,
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// 統合レスポンス型
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// ページネーション情報のスキーマ
export const paginationSchema = z.object({
  current_page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
  total_count: z.number().int().nonnegative(),
});

export type Pagination = z.infer<typeof paginationSchema>;

// ページネーション付きレスポンスのスキーマ（ジェネリック）
export const paginatedDataSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: paginationSchema,
  });

export type PaginatedData<T> = {
  items: T[];
  pagination: Pagination;
};

// ページネーションリクエストパラメータのスキーマ
export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;

import { NextResponse } from "next/server";
import { z, ZodError, ZodSchema } from "zod";

import {
  ApiResponse,
  ErrorCode,
  ErrorResponse,
  SuccessResponse,
  ValidationErrorDetail,
} from "./response";

// 成功レスポンスを生成
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

// エラーレスポンスを生成
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: ValidationErrorDetail[]
): NextResponse<ErrorResponse> {
  const error: ErrorResponse["error"] = { code, message };
  if (details && details.length > 0) {
    error.details = details;
  }
  return NextResponse.json({ success: false, error }, { status });
}

// よく使うエラーレスポンスのヘルパー
export const ApiErrors = {
  invalidCredentials: () =>
    errorResponse(
      ErrorCode.INVALID_CREDENTIALS,
      "メールアドレスまたはパスワードが正しくありません",
      401
    ),

  tokenExpired: () =>
    errorResponse(ErrorCode.TOKEN_EXPIRED, "トークンの有効期限が切れています", 401),

  forbidden: (message: string = "この操作を実行する権限がありません") =>
    errorResponse(ErrorCode.FORBIDDEN, message, 403),

  notFound: (resource: string = "リソース") =>
    errorResponse(ErrorCode.NOT_FOUND, `${resource}が見つかりません`, 404),

  validationError: (details: ValidationErrorDetail[]) =>
    errorResponse(ErrorCode.VALIDATION_ERROR, "入力内容に誤りがあります", 400, details),

  duplicateReport: () =>
    errorResponse(ErrorCode.DUPLICATE_REPORT, "この日付の日報は既に存在します", 409),

  duplicateEmail: () =>
    errorResponse(ErrorCode.DUPLICATE_EMAIL, "このメールアドレスは既に使用されています", 409),

  internalError: () => errorResponse(ErrorCode.INTERNAL_ERROR, "サーバーエラーが発生しました", 500),
};

// ZodErrorをバリデーションエラーレスポンスに変換
export function zodErrorToResponse(error: ZodError): NextResponse<ErrorResponse> {
  const details: ValidationErrorDetail[] = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
  return ApiErrors.validationError(details);
}

// リクエストボディをバリデート
export async function validateRequestBody<T extends ZodSchema>(
  request: Request,
  schema: T
): Promise<
  { success: true; data: z.infer<T> } | { success: false; response: NextResponse<ErrorResponse> }
> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return { success: false, response: zodErrorToResponse(result.error) };
    }

    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: errorResponse(
        ErrorCode.VALIDATION_ERROR,
        "リクエストボディの解析に失敗しました",
        400
      ),
    };
  }
}

// クエリパラメータをバリデート
export function validateQueryParams<T extends ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse<ErrorResponse> } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    return { success: false, response: zodErrorToResponse(result.error) };
  }

  return { success: true, data: result.data };
}

// APIハンドラーをラップしてエラーハンドリングを統一
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  return handler().catch((error) => {
    console.error("API Error:", error);
    return ApiErrors.internalError() as NextResponse<ApiResponse<T>>;
  });
}

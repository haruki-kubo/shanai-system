import { NextRequest, NextResponse } from "next/server";

import { AuthError, verifyToken } from "./jwt";

import type { JwtPayload } from "./jwt";

export interface AuthenticatedRequest extends NextRequest {
  user: JwtPayload;
}

/**
 * Authorizationヘッダーからトークンを抽出する
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * 認証が必要なAPIルートのハンドラーをラップする
 */
export function withAuth<T>(
  handler: (request: AuthenticatedRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    const token = extractToken(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "認証が必要です",
          },
        },
        { status: 401 }
      );
    }

    try {
      const payload = verifyToken(token);
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        userId: payload.userId,
        email: payload.email,
        isManager: payload.isManager,
      };

      return handler(authenticatedRequest, context);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
            },
          },
          { status: 401 }
        );
      }
      throw error;
    }
  };
}

/**
 * リクエストからユーザー情報を取得する（オプショナル認証用）
 */
export function getAuthUser(request: NextRequest): JwtPayload | null {
  const token = extractToken(request);
  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    return {
      userId: payload.userId,
      email: payload.email,
      isManager: payload.isManager,
    };
  } catch {
    return null;
  }
}

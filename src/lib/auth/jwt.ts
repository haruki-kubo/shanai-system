import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export interface JwtPayload {
  userId: number;
  email: string;
  isManager: boolean;
}

interface TokenPayload extends JwtPayload {
  iat: number;
  exp: number;
}

const TOKEN_EXPIRY = "24h";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

/**
 * JWTトークンを生成する
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * JWTトークンを検証してペイロードを返す
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new AuthError("TOKEN_EXPIRED", "トークンの有効期限が切れています");
    }
    if (error instanceof JsonWebTokenError) {
      throw new AuthError("INVALID_TOKEN", "無効なトークンです");
    }
    throw error;
  }
}

/**
 * トークンをデコードする（検証なし）
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload | null;
  } catch {
    return null;
  }
}

/**
 * 認証エラークラス
 */
export class AuthError extends Error {
  constructor(
    public code: "TOKEN_EXPIRED" | "INVALID_TOKEN" | "INVALID_CREDENTIALS" | "UNAUTHORIZED",
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

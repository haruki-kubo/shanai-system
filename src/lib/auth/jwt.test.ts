import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { generateToken, verifyToken, decodeToken, AuthError } from "./jwt";

describe("JWT utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: "test-secret-key-for-testing" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const payload = {
        userId: 1,
        email: "test@example.com",
        isManager: false,
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token and return payload", () => {
      const payload = {
        userId: 1,
        email: "test@example.com",
        isManager: true,
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.isManager).toBe(payload.isManager);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it("should throw AuthError for invalid token", () => {
      expect(() => verifyToken("invalid-token")).toThrow(AuthError);
      expect(() => verifyToken("invalid-token")).toThrow("無効なトークンです");
    });

    it("should throw AuthError for expired token", async () => {
      // Create a token that expires immediately
      vi.useFakeTimers();
      const payload = {
        userId: 1,
        email: "test@example.com",
        isManager: false,
      };

      const token = generateToken(payload);

      // Advance time by 25 hours (token expires in 24h)
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      expect(() => verifyToken(token)).toThrow(AuthError);
      expect(() => verifyToken(token)).toThrow("トークンの有効期限が切れています");

      vi.useRealTimers();
    });
  });

  describe("decodeToken", () => {
    it("should decode a token without verification", () => {
      const payload = {
        userId: 1,
        email: "test@example.com",
        isManager: false,
      };

      const token = generateToken(payload);
      const decoded = decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.email).toBe(payload.email);
    });

    it("should return null for invalid token", () => {
      const decoded = decodeToken("not-a-valid-jwt");
      expect(decoded).toBeNull();
    });
  });

  describe("AuthError", () => {
    it("should have correct properties", () => {
      const error = new AuthError("INVALID_TOKEN", "test message");

      expect(error.code).toBe("INVALID_TOKEN");
      expect(error.message).toBe("test message");
      expect(error.name).toBe("AuthError");
    });
  });
});

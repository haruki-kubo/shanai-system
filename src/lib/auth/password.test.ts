import { describe, it, expect } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("Password utilities", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "testPassword123";
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it("should generate different hashes for the same password", async () => {
      const password = "testPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for correct password", async () => {
      const password = "testPassword123";
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword";
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hashed);

      expect(isValid).toBe(false);
    });

    it("should handle empty password", async () => {
      const password = "";
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it("should handle special characters in password", async () => {
      const password = "p@$$w0rd!#$%^&*()_+{}|:<>?";
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it("should handle unicode characters in password", async () => {
      const password = "パスワード123";
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });
  });
});

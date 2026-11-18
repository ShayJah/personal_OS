import { describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import { decryptSecret, encryptSecret } from "@/lib/secrets";

describe("secrets", () => {
  it("passes values through when no key is set, and reads old plain-text rows", () => {
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", "");
    expect(encryptSecret("tok")).toBe("tok");
    expect(decryptSecret("tok")).toBe("tok");
  });
  it("round-trips with a key and does not store the plain text", () => {
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", crypto.randomBytes(32).toString("base64"));
    const stored = encryptSecret("refresh-token");
    expect(stored).not.toContain("refresh-token");
    expect(decryptSecret(stored)).toBe("refresh-token");
    expect(decryptSecret("old-plain-text")).toBe("old-plain-text");
  });
});

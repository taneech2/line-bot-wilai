import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyLineSignature } from "./line-bot";
import crypto from "crypto";

describe("LINE Webhook Signature Verification", () => {
  const testSecret = "09690d061adeadabddceacee96cf278e";
  const testBody = JSON.stringify({ events: [] });

  beforeEach(() => {
    process.env.LINE_CHANNEL_SECRET = testSecret;
  });

  it("should verify valid LINE signature", () => {
    const hash = crypto
      .createHmac("sha256", testSecret)
      .update(testBody)
      .digest("base64");

    const result = verifyLineSignature(testBody, hash);
    expect(result).toBe(true);
  });

  it("should reject invalid LINE signature", () => {
    const invalidSignature = "invalid_signature_here";
    const result = verifyLineSignature(testBody, invalidSignature);
    expect(result).toBe(false);
  });

  it("should reject missing signature", () => {
    const result = verifyLineSignature(testBody, undefined);
    expect(result).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { lineWebhookMiddleware } from "./line-webhook-middleware";
import crypto from "crypto";

describe("LINE Webhook Middleware", () => {
  const testSecret = "09690d061adeadabddceacee96cf278e";
  const testBody = { events: [] };
  const testBodyString = JSON.stringify(testBody);

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    process.env.LINE_CHANNEL_SECRET = testSecret;

    // สร้าง mock request
    mockReq = {
      method: "POST",
      headers: {},
      body: testBody,
    };

    // สร้าง mock response
    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn().mockReturnThis();

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = vi.fn();
  });

  it("should return 200 OK with valid signature", async () => {
    // สร้าง valid signature
    const hash = crypto
      .createHmac("sha256", testSecret)
      .update(testBodyString)
      .digest("base64");

    mockReq.headers = {
      "x-line-signature": hash,
    };

    await lineWebhookMiddleware(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ ok: true });
  });

  it("should return 401 with invalid signature", async () => {
    mockReq.headers = {
      "x-line-signature": "invalid_signature",
    };

    await lineWebhookMiddleware(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it("should return 405 for non-POST requests", async () => {
    mockReq.method = "GET";

    await lineWebhookMiddleware(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(405);
  });
});

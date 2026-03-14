import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleLineWebhook } from "./line-bot";

// Mock axios to prevent actual API calls
vi.mock("axios");

// Mock Gemini API
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "ตอบทดสอบจาก Gemini",
        },
      },
    ],
  }),
}));

describe("LINE Bot Group Chat Support", () => {
  beforeEach(() => {
    process.env.LINE_CHANNEL_SECRET = "test-secret";
    process.env.LINE_CHANNEL_ACCESS_TOKEN = "test-token";
    vi.clearAllMocks();
  });

  it("should respond to all messages in 1:1 chat", async () => {
    const body = {
      events: [
        {
          type: "message",
          message: {
            type: "text",
            text: "สวัสดี",
            id: "100001",
          },
          replyToken: "test-reply-token",
          source: {
            type: "user",
            userId: "U123456",
          },
          timestamp: 1234567890,
        },
      ],
    };

    // Should not throw
    await expect(handleLineWebhook(body as any)).resolves.not.toThrow();
  });

  it("should respond to group message with 'ธานี' keyword", async () => {
    const body = {
      events: [
        {
          type: "message",
          message: {
            type: "text",
            text: "ธานี วันนี้อากาศเป็นยังไง",
            id: "100001",
          },
          replyToken: "test-reply-token",
          source: {
            type: "group",
            groupId: "G123456",
            userId: "U123456",
          },
          timestamp: 1234567890,
        },
      ],
    };

    // Should not throw
    await expect(handleLineWebhook(body as any)).resolves.not.toThrow();
  });

  it("should ignore group message without 'ธานี' keyword", async () => {
    const body = {
      events: [
        {
          type: "message",
          message: {
            type: "text",
            text: "วันนี้อากาศดีจังเลย",
            id: "100001",
          },
          replyToken: "test-reply-token",
          source: {
            type: "group",
            groupId: "G123456",
            userId: "U123456",
          },
          timestamp: 1234567890,
        },
      ],
    };

    // Should not throw
    await expect(handleLineWebhook(body as any)).resolves.not.toThrow();
  });

  it("should respond to room message with 'ธานี' keyword", async () => {
    const body = {
      events: [
        {
          type: "message",
          message: {
            type: "text",
            text: "ถามธานีหน่อย เรื่องอะไรดี",
            id: "100001",
          },
          replyToken: "test-reply-token",
          source: {
            type: "room",
            roomId: "R123456",
            userId: "U123456",
          },
          timestamp: 1234567890,
        },
      ],
    };

    // Should not throw
    await expect(handleLineWebhook(body as any)).resolves.not.toThrow();
  });

  it("should ignore room message without 'ธานี' keyword", async () => {
    const body = {
      events: [
        {
          type: "message",
          message: {
            type: "text",
            text: "ใครมีความเห็นบ้าง",
            id: "100001",
          },
          replyToken: "test-reply-token",
          source: {
            type: "room",
            roomId: "R123456",
            userId: "U123456",
          },
          timestamp: 1234567890,
        },
      ],
    };

    // Should not throw
    await expect(handleLineWebhook(body as any)).resolves.not.toThrow();
  });

  it("should detect 'ธานี' keyword case-insensitively", async () => {
    const body = {
      events: [
        {
          type: "message",
          message: {
            type: "text",
            text: "ธานี ธานี ธานี",
            id: "100001",
          },
          replyToken: "test-reply-token",
          source: {
            type: "group",
            groupId: "G123456",
            userId: "U123456",
          },
          timestamp: 1234567890,
        },
      ],
    };

    // Should not throw
    await expect(handleLineWebhook(body as any)).resolves.not.toThrow();
  });
});

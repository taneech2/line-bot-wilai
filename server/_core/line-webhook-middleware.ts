import { Request, Response, NextFunction } from "express";
import { verifyLineSignature, handleLineWebhook } from "../line-bot";

/**
 * Express middleware สำหรับรับ LINE webhook requests
 * LINE ส่ง raw JSON POST request มาที่ /api/line/webhook
 * ต้อง return 200 OK ทันทีเพื่อให้ LINE รู้ว่าได้รับข้อมูลแล้ว
 */
export async function lineWebhookMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // ตรวจสอบว่าเป็น POST request
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Return 200 OK ทันทีให้ LINE รู้ว่าได้รับข้อมูลแล้ว
    res.status(200).json({ ok: true });

    // Parse body
    let body = req.body;
    if (Buffer.isBuffer(body)) {
      body = JSON.parse(body.toString("utf-8"));
    }

    // จัดการ webhook events แบบ async (ไม่รอให้เสร็จ)
    if (body && body.events) {
      handleLineWebhook(body).catch((error) => {
        console.error("[LINE] Error handling webhook:", error);
      });
    }
  } catch (error) {
    console.error("[LINE] Error in webhook middleware:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

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
    // ดึง signature จาก headers
    const signature = req.headers["x-line-signature"] as string | undefined;

    // ดึง raw body string เพื่อตรวจสอบ signature
    // express.raw() middleware ส่ง Buffer มา
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf-8") : JSON.stringify(req.body);

    // ตรวจสอบ signature
    if (!verifyLineSignature(rawBody, signature)) {
      console.warn("[LINE] Invalid signature in webhook");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Return 200 OK ทันทีให้ LINE รู้ว่าได้รับข้อมูลแล้ว
    res.status(200).json({ ok: true });

    // Parse body เป็น JSON
    const body = Buffer.isBuffer(req.body) ? JSON.parse(rawBody) : req.body;

    // จัดการ webhook events แบบ async (ไม่รอให้เสร็จ)
    handleLineWebhook(body).catch((error) => {
      console.error("[LINE] Error handling webhook:", error);
    });
  } catch (error) {
    console.error("[LINE] Error in webhook middleware:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

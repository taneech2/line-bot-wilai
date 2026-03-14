import crypto from "crypto";
import axios from "axios";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { saveConversationMessage, getConversationHistory } from "./db";

// Google Sheets integration
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1bdWBAQ1BynOQXKeVVS4PS0-vV0_0pqGp440XhWjWHug/export?format=csv";
let cachedSheetData: string | null = null;
let lastSheetFetch: number = 0;
const SHEET_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchGoogleSheetData(): Promise<string | null> {
  const now = Date.now();
  if (cachedSheetData && (now - lastSheetFetch) < SHEET_CACHE_TTL) {
    return cachedSheetData;
  }
  try {
    const response = await axios.get(GOOGLE_SHEETS_CSV_URL, { timeout: 5000 });
    cachedSheetData = response.data;
    lastSheetFetch = now;
    console.log("[LINE] Google Sheets data fetched successfully");
    return cachedSheetData;
  } catch (error) {
    console.error("[LINE] Error fetching Google Sheets:", error);
    return cachedSheetData; // return old cache if available
  }
}

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_API_URL = "https://api.line.me/v2/bot/message/reply";

interface LineEvent {
  type: string;
  message?: {
    type: string;
    text?: string;
    id: string;
  };
  replyToken?: string;
  source?: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  timestamp: number;
}

interface LineWebhookBody {
  events: LineEvent[];
}

/**
 * ตรวจสอบ LINE signature เพื่อความปลอดภัย
 * ตามเอกสาร LINE Messaging API: https://developers.line.biz/en/docs/messaging-api/receiving-messages/
 */
export function verifyLineSignature(
  body: string,
  signature: string | undefined
): boolean {
  if (!signature || !LINE_CHANNEL_SECRET) {
    console.warn("[LINE] Missing signature or channel secret");
    return false;
  }

  const hash = crypto
    .createHmac("sha256", LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");

  const isValid = hash === signature;
  if (!isValid) {
    console.warn("[LINE] Invalid signature");
  }
  return isValid;
}

/**
 * ตรวจสอบว่าเป็นแชทส่วนตัว (1:1) หรือกลุ่ม
 * @returns "user" สำหรับแชทส่วนตัว, "group" สำหรับกลุ่ม, "room" สำหรับห้องแชท
 */
function getChatType(source: LineEvent["source"]): "user" | "group" | "room" | null {
  if (!source) return null;
  
  if (source.type === "user") return "user";
  if (source.type === "group") return "group";
  if (source.type === "room") return "room";
  
  return null;
}

/**
 * ตรวจสอบว่าข้อความมีคำว่า "วิลัย" อยู่ด้วยหรือไม่
 * @param message ข้อความที่ต้องตรวจสอบ
 * @returns true ถ้ามีคำว่า "วิลัย" อยู่ด้วย
 */
function containsWilaiKeyword(message: string): boolean {
  // ตรวจสอบคำว่า "วิลัย" (case-insensitive)
  return message.toLowerCase().includes("วิลัย");
}

/**
 * ตรวจสอบว่าควรตอบข้อความนี้หรือไม่
 * - ถ้าเป็นแชทส่วนตัว ตอบทุกข้อความ
 * - ถ้าเป็นกลุ่มหรือห้องแชท ตอบเฉพาะเมื่อมีคำว่า "วิลัย"
 */
function shouldRespond(chatType: string | null, message: string): boolean {
  if (chatType === "user") {
    // แชทส่วนตัว - ตอบทุกข้อความ
    return true;
  }
  
  if (chatType === "group" || chatType === "room") {
    // กลุ่มหรือห้องแชท - ตอบเฉพาะเมื่อมีคำว่า "วิลัย"
    return containsWilaiKeyword(message);
  }
  
  return false;
}

/**
 * สร้างคำตอบจาก Gemini AI โดยใช้บุคลิก "วิลัย"
 * @param userMessage ข้อความจากผู้ใช้
 * @param lineUserId LINE user/group ID สำหรับเรียกประวัติแชท
 */
async function generateResponse(userMessage: string, lineUserId: string): Promise<string> {
  try {
    // ดึงข้อมูลจาก Google Sheets
    const sheetData = await fetchGoogleSheetData();
    const sheetSection = sheetData ? `\n\n## ข้อมูลล่าสุดจาก Google Sheets (ฐานข้อมูลวิทยาลัย)\n${sheetData}` : "";

    const systemPrompt = `คุณคือ "วิลัย" ผู้ช่วยเสมือนจริงของวิทยาลัยการอาชีพบุรีรัมย์ มีบุคลิกดังนี้:

## บุคลิกและวิธีการสื่อสาร
- ชื่อ: วิลัย (เพศหญิง)
- พูดแบบเป็นกันเอง สนุกสนาน และเป็นมิตร
- ใช้ภาษาไทยเป็นหลัก พูดง่าย ๆ ใกล้ชิด
- มีอารมณ์ขัน แต่ยังคงเป็นประโยชน์
- ไม่เป็นทางการมากนัก แต่ก็มีความเป็นมืออาชีพ
- ตอบสั้น ๆ เหมาะสำหรับการแชท (ไม่เกิน 2-3 ประโยค)
- ใช้คำว่า "ค่ะ" แทน "ครับ" เพื่อแสดงว่าเป็นผู้หญิง

## ข้อมูลวิทยาลัยการอาชีพบุรีรัมย์
**ชื่อวิทยาลัย**: วิทยาลัยการอาชีพบุรีรัมย์ (Buriram Vocational College)
**ย่อ**: BRIC
**ที่อยู่**: เลขที่ 138 หมู่ที่ – ถนนจิระ ต.ในเมือง อ.เมือง จ.บุรีรัมย์ รหัส 31000
**จังหวัด**: บุรีรัมย์
**ประเภท**: วิทยาลัยการอาชีพ
**สัญญาประจำวิทยาลัย**: ฝีมือดี มีคุณธรรม ทำงานเป็น เน้นคุณภาพ
**เว็บไซต์**: https://www.bric.ac.th/
**Facebook**: https://www.facebook.com/bricfanpage/

## ข้อมูลผลลูกเสือ
**ปีการศึกษา**: 2568
**ประเภท**: ผลลูกเสือวิสามัญ (ระดับ 1)
**จำนวนลูกเสือ**: มากกว่า 36 คน (ตามข้อมูลใน Google Sheets)
**แหล่งข้อมูลผลลูกเสือ**: https://docs.google.com/spreadsheets/d/1PvDK_F1YpMNcK8riHMOqaT2PObnPMKBIb74DVcgmeIc/edit?usp=sharing

## ข้อมูลผลกิจกรรม ปวช.1 ปี 2568
**ปีการศึกษา**: 2568
**ระดับ**: ปวช.1 (Vocational Certificate Level 1)
**ภาคเรียน**: หรือคนที่ 2
**จำนวนนักเรียน**: มากกว่า 25 คน (ตามข้อมูลใน OneDrive)
**เสนอข้อมูลผลกิจกรรม**: https://1drv.ms/x/c/6a4079bc6ccd065e/IQBbSrPLvO9lQ6v5p0dTfJWYAbWuEm4KgHS7Fnk_QgX_LFA?e=0Q3FjH
**หมายหมู่**: ผลกิจกรรมแสดงด้วยสี (H=ผ่าน, ไม่ผ่าน=ไม่ผ่าน, UH=ต้องปรับปรุง)

## ข้อมูลเกรดนักเรียน ปวช.1 ปี 2568
**สถาบัน**: สถาบันการอาชีวศึกษาวิทยาลัยการอาชีพบุรีรัมย์
**สาขาวิชา**: ช่างเชื่อมโลหะ
**ระดับ**: ปวช. (ประกาศ ปวช.)
**ชั้นปีที่**: 1
**ปีการศึกษา**: 2568
**หมายหมู่**: ใบรายงานผลการเรียนสำหรับภาคเรียนที่ 1 และ 2 หรือคนที่ 2568
**แหล่งข้อมูลเกรด**: https://drive.google.com/file/d/1XBU2UkFB_gCvA_hWThDC2nGJxZKRFXG_/view?usp=sharing
**สัญลักษณ์**: ข.r. = ขาดเรียน/ไม่ผ่าน, ม.ผ. = ไม่ผ่าน (กิจกรรม), ม.ส. = ไม่ส่งงาน, ผ. = ผ่าน (กิจกรรม)

## คำปฏิญาณของลูกเสือ
ด้วยเกียรติของข้า ข้าสัญญาว่า
- ข้อ 1. ข้าจะจงรักภักดีต่อชาติ ศาสนา พระมหากษัตริย์
- ข้อ 2. ข้าจะช่วยเหลือผู้อื่นทุกเมื่อ
- ข้อ 3. ข้าจะปฏิบัติตามกฎของลูกเสือ

## กฎของลูกเสือ (10 ข้อ)
- ข้อ 1. ลูกเสือมีเกียรติเชื่อถือได้
- ข้อ 2. ลูกเสือมีความจงรักภักดีต่อชาติ ศาสนา พระมหากษัตริย์ และซื่อตรงต่อผู้มีพระคุณ
- ข้อ 3. ลูกเสือมีหน้าที่กระทำตนให้เป็นประโยชน์และช่วยเหลือผู้อื่น
- ข้อ 4. ลูกเสือเป็นมิตรของคนทุกคน และเป็นพี่น้องกับลูกเสืออื่นทั่วโลก
- ข้อ 5. ลูกเสือเป็นผู้สุภาพเรียบร้อย
- ข้อ 6. ลูกเสือมีความเมตตากรุณาต่อสัตว์
- ข้อ 7. ลูกเสือเชื่อฟังคำสั่งของบิดามารดา และผู้บังคับบัญชาด้วยความเคารพ
- ข้อ 8. ลูกเสือมีใจร่าเริง และไม่ย่อท้อต่อความยากลำบาก
- ข้อ 9. ลูกเสือเป็นผู้มัธยัสถ์
- ข้อ 10. ลูกเสือประพฤติชอบด้วยกาย วาจา ใจ

## คติพจน์ของลูกเสือ
- ลูกเสือสำรอง: ทำดีที่สุด
- ลูกเสือสามัญ: จงเตรียมพร้อม
- ลูกเสือสามัญรุ่นใหญ่: มองไกล
- ลูกเสือวิสามัญ: บริการ

**หมายเหตุ**: ลูกเสือระดับ ปวช. เป็นลูกเสือวิสามัญ ที่มีคติพจน์ว่า "บริการ"

### การเตือนเติมพฤติกรรมที่ไม่สอดคล้องกฎของลูกเสือ
ถ้าคุณพบว่าคำพูดหรือการกระทำตนที่ไม่สอดคล้องกฎของลูกเสือ ให้วิลัยทำการเตือนเติมคนนั้นด้วยคำพูดที่อ่อนหนุนและคำกฎของลูกเสือที่กำหนดไว้หนี่ค่ะ

## คำแนะนำสำหรับการตอบคำถาม
1. ถ้าคุณรู้ข้อมูลที่ถามมา ให้ตอบด้วยข้อมูลจริงจากข้างบน
2. ถ้าคุณไม่รู้ข้อมูลที่ถาม ให้ตอบว่า "ขอโทษนะค่ะ วิลัยไม่ทราบข้อมูลนั้น แนะนำให้ดู OneDrive, Google Sheets หรือ Google Drive" แล้วให้ลิงก์
3. อย่าแต่งเรื่องหรือเดาข้อมูลที่ไม่แน่ใจ
4. ถ้าเป็นคำถามทั่วไปที่ไม่เกี่ยวข้องวิทยาลัย ผลลูกเสือ ผลกิจกรรม หรือเกรด ให้ตอบได้ตามปกติดว่าของวิลัย
5. ถ้าคุณแสดงพฤติกรรมที่ไม่สอดคล้องกฎของลูกเสือ (เช่น การกล่าวศันยา การดูถูกกฎ การกล่าวคน การไม่เคารพี่น้อง การสุภาพเรียบร้อย) ให้วิลัยทำการเตือนเติมสำหรับการปฏิบัติตามคำปฏิญาณและกฎของลูกเสือวิลัย
6. ถ้าข้อมูลมาจาก Google Search ให้เตือนผู้ใช้ว่า "ข้อมูลนี้มาจากการค้นหาอินเทอร์เน็ต อาจไม่ถูกต้อง 100% กรุณาตรวจสอบเพิ่มเติมค่ะ"
${sheetSection}
ตอบคำถามของผู้ใช้ด้วยบุคลิกนี้เสมอ`;

    // ใช้ Gemini API โดยตรงเพื่อเปิดใช้ Google Search grounding
    const geminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY not found in environment");
    }

    // ดึงประวัติแชทจากฐานข้อมูล
    const conversationHistory = await getConversationHistory(lineUserId, 10);
    
    // สร้าง contents array โดยรวมประวัติแชท
    const contents: any[] = [];
    
    // เพิ่มข้อความจากประวัติแชท
    for (const msg of conversationHistory) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [
          {
            text: msg.content,
          },
        ],
      });
    }
    
    // เพิ่มข้อความปัจจุบันพร้อม system prompt
    contents.push({
      role: "user",
      parts: [
        {
          text: `${systemPrompt}\n\nคำถาม: ${userMessage}`,
        },
      ],
    });

    const requestBody = {
      contents,
      tools: [
        {
          googleSearch: {},
        },
      ],
    };

    const geminiResponse = await axios.post(
      `${geminiApiUrl}?key=${geminiApiKey}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = geminiResponse.data || geminiResponse;

    // แยกข้อความจากการตอบสนองของ Gemini API
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      console.error("[LINE] No candidates in Gemini response");
      return "ขอโทษนะค่ะ วิลัยไม่สามารถตอบได้ในตอนนี้ 😅";
    }

    const content = candidates[0]?.content?.parts?.[0]?.text;
    if (!content) {
      console.error("[LINE] No text content in Gemini response");
      return "ขอโทษนะค่ะ วิลัยไม่สามารถตอบได้ในตอนนี้ 😅";
    }

    // บันทึกคำตอบของบอทลงในประวัติแชท
    await saveConversationMessage(lineUserId, "assistant", content);

    return content;
  } catch (error) {
    console.error("[LINE] Error calling Gemini API:", error);
    return "ขอโทษนะค่ะ วิลัยมีปัญหาเล็กน้อย กรุณาลองใหม่นะ 🙏";
  }
}

/**
 * ส่งข้อความตอบกลับไปยัง LINE โดยใช้ LINE Messaging API
 */
async function replyToLine(
  replyToken: string,
  text: string
): Promise<boolean> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error("[LINE] Missing channel access token");
    return false;
  }

  try {
    console.log(`[LINE] Sending message to LINE API: "${text}"`);
    
    const response = await axios.post(
      LINE_API_URL,
      {
        replyToken,
        messages: [
          {
            type: "text",
            text,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    console.log("[LINE] Message sent successfully via LINE API");
    return true;
  } catch (error) {
    console.error("[LINE] Error replying to LINE:", error);
    return false;
  }
}

/**
 * จัดการ LINE webhook events
 */
export async function handleLineWebhook(body: LineWebhookBody): Promise<void> {
  console.log("[LINE] Webhook received with", body.events.length, "events");
  
  for (const event of body.events) {
    // ตรวจสอบว่าเป็น message event
    if (event.type !== "message") {
      console.log(`[LINE] Ignoring non-message event: ${event.type}`);
      continue;
    }

    // ตรวจสอบว่าเป็น text message
    if (event.message?.type !== "text" || !event.message?.text) {
      console.log("[LINE] Ignoring non-text message");
      continue;
    }

    const userMessage = event.message.text;
    const replyToken = event.replyToken;
    const chatType = getChatType(event.source);
    
    // ดึง LINE user/group ID สำหรับเก็บประวัติแชท
    const lineUserId = event.source?.userId || event.source?.groupId || event.source?.roomId;

    if (!replyToken) {
      console.warn("[LINE] Missing replyToken");
      continue;
    }

    if (!lineUserId) {
      console.warn("[LINE] Missing user/group ID");
      continue;
    }

    console.log(`[LINE] Received message from ${chatType}: "${userMessage}"`);

    // ตรวจสอบว่าควรตอบข้อความนี้หรือไม่
    if (!shouldRespond(chatType, userMessage)) {
      console.log(`[LINE] Ignoring message in ${chatType} without "วิลัย" keyword`);
      continue;
    }

    // บันทึกข้อความของผู้ใช้ลงในประวัติแชท
    await saveConversationMessage(lineUserId, "user", userMessage);

    // สร้างคำตอบจาก Gemini
    const response = await generateResponse(userMessage, lineUserId);

    // ส่งข้อความตอบกลับ
    const success = await replyToLine(replyToken, response);
    if (success) {
      console.log(`[LINE] Replied successfully: "${response}"`);
    } else {
      console.error("[LINE] Failed to reply");
    }
  }
}

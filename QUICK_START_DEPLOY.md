# Quick Start - Deploy บน Google Cloud Run (5 นาที)

## ขั้นตอนด่วน

### 1. ตั้งค่า gcloud CLI

```bash
# ติดตั้ง gcloud CLI (ถ้ายังไม่ติดตั้ง)
# https://cloud.google.com/sdk/docs/install

# ล็อกอิน
gcloud auth login

# ตั้งค่า project
gcloud config set project YOUR_PROJECT_ID
```

### 2. เตรียม Environment Variables

สร้างไฟล์ `deploy-env.txt`:

```
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret
GEMINI_API_KEY=your_key
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=your_secret_key
BUILT_IN_FORGE_API_URL=your_url
BUILT_IN_FORGE_API_KEY=your_key
```

### 3. Deploy ด้วยคำสั่งเดียว

```bash
# แทน YOUR_PROJECT_ID ด้วย project ID จริง
gcloud run deploy line-bot-thanee \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --env-vars-file deploy-env.txt
```

### 4. ตั้งค่า Webhook URL ใน LINE

1. ไปที่ LINE Developers Console
2. ไปที่ Messaging API → Webhook URL
3. ใส่: `https://line-bot-thanee-xxxxx.run.app/api/line/webhook`
4. คลิก Verify
5. เปิด Use webhook

### 5. ทดสอบ

ส่งข้อความไปหาบอทใน LINE - บอทควรตอบกลับ ✅

## ติดต่อ

หากมีปัญหา ดู `DEPLOYMENT_GUIDE.md` สำหรับรายละเอียดเพิ่มเติม

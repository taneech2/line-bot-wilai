# LINE Bot "คุยกับธานี" - Google Cloud Run Deployment Guide

บอทธานีพร้อม deploy บน Google Cloud Run เพื่อให้ทำงานตลอด 24 ชม.

## ข้อกำหนดเบื้องต้น

1. **Google Cloud Account** - มี Google Cloud project ที่ใช้งานได้
2. **Google Cloud CLI** - ติดตั้ง `gcloud` CLI แล้ว
3. **Docker** - ติดตั้ง Docker ไว้สำหรับ build image (optional - Cloud Build ทำให้)
4. **LINE Channel Credentials** - มี LINE Channel Access Token และ Secret
5. **Gemini API Key** - มี API key สำหรับ Gemini

## ขั้นตอนการ Deploy

### 1. เตรียม Google Cloud Project

```bash
# ตั้งค่า project ID
export PROJECT_ID="your-project-id"
export REGION="asia-southeast1"  # หรือ region อื่น

# ตั้งค่า gcloud
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION
```

### 2. เตรียม Environment Variables

สร้างไฟล์ `.env.production` ที่มี variables ดังนี้:

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/database_name

# LINE Bot
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Manus OAuth (optional - สำหรับ web dashboard)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Manus Built-in API
BUILT_IN_FORGE_API_URL=your_forge_api_url
BUILT_IN_FORGE_API_KEY=your_forge_api_key
```

### 3. Deploy ไปยัง Google Cloud Run

#### วิธีที่ 1: ใช้ gcloud CLI (แนะนำ)

```bash
# Build และ deploy ในครั้งเดียว
gcloud run deploy line-bot-thanee \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=$DATABASE_URL,LINE_CHANNEL_ACCESS_TOKEN=$LINE_CHANNEL_ACCESS_TOKEN,LINE_CHANNEL_SECRET=$LINE_CHANNEL_SECRET,GEMINI_API_KEY=$GEMINI_API_KEY,JWT_SECRET=$JWT_SECRET,BUILT_IN_FORGE_API_URL=$BUILT_IN_FORGE_API_URL,BUILT_IN_FORGE_API_KEY=$BUILT_IN_FORGE_API_KEY"
```

#### วิธีที่ 2: ใช้ Cloud Console

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. ไปที่ **Cloud Run**
3. คลิก **Create Service**
4. เลือก **Deploy one revision from an image**
5. ใส่ image URL: `gcr.io/$PROJECT_ID/line-bot-thanee:latest`
6. ตั้งค่า Environment variables
7. คลิก **Deploy**

### 4. ตั้งค่า Webhook URL ใน LINE Developers Console

หลังจาก deploy สำเร็จ:

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. ไปที่ **Messaging API** → **Webhook URL**
3. ใส่ URL จาก Cloud Run: `https://your-service-name-xxxxx.run.app/api/line/webhook`
4. คลิก **Verify** เพื่อทดสอบ
5. เปิด **Use webhook**

### 5. ตรวจสอบ Logs

```bash
# ดู logs จาก Cloud Run
gcloud run logs read line-bot-thanee --region $REGION --limit 50

# ดู logs แบบ real-time
gcloud run logs read line-bot-thanee --region $REGION --limit 50 --follow
```

## การอัปเดตบอท

เมื่อมีการเปลี่ยนแปลงโค้ด:

```bash
# Build image ใหม่
docker build -t gcr.io/$PROJECT_ID/line-bot-thanee:latest .

# Push ไปยัง Google Container Registry
docker push gcr.io/$PROJECT_ID/line-bot-thanee:latest

# Deploy ใหม่
gcloud run deploy line-bot-thanee \
  --image gcr.io/$PROJECT_ID/line-bot-thanee:latest \
  --region $REGION
```

หรือใช้ gcloud CLI เพื่อ build และ deploy ในครั้งเดียว:

```bash
gcloud run deploy line-bot-thanee \
  --source . \
  --region $REGION
```

## การแก้ไขปัญหา

### Error: "The webhook returned an HTTP status code other than 200"

- ตรวจสอบ logs: `gcloud run logs read line-bot-thanee`
- ตรวจสอบ environment variables ถูกต้องหรือไม่
- ตรวจสอบ database connection

### Error: "Database connection failed"

- ตรวจสอบ `DATABASE_URL` ถูกต้องหรือไม่
- ตรวจสอบ Cloud Run instance สามารถเข้าถึง database ได้หรือไม่
- หากใช้ Cloud SQL ให้ตั้งค่า Cloud SQL Proxy

### Error: "GEMINI_API_KEY not found"

- ตรวจสอบว่าตั้งค่า environment variable ถูกต้องหรือไม่
- ตรวจสอบ API key ยังใช้งานได้หรือไม่

## ค่าใช้บริการ

Google Cloud Run มีค่าใช้บริการ:

- **Compute time**: $0.00002400 ต่อ vCPU-second
- **Memory**: $0.00000250 ต่อ GB-second
- **Requests**: $0.40 ต่อ 1 ล้าน requests
- **First 2 million requests/month**: ฟรี

สำหรับบอท LINE ที่ไม่มีการใช้งานสูง ค่าใช้บริการจะน้อยมาก

## ข้อเสนอแนะเพิ่มเติม

1. **ตั้งค่า Auto-scaling** - Cloud Run จะ auto-scale ตามความต้องการ
2. **ใช้ Cloud SQL** - สำหรับ database ที่ปลอดภัยและ reliable
3. **ตั้งค่า Monitoring** - ใช้ Cloud Monitoring เพื่อตรวจสอบประสิทธิภาพ
4. **ใช้ Secret Manager** - เก็บ secrets ใน Google Secret Manager แทน environment variables

## ติดต่อสำหรับความช่วยเหลือ

หากมีปัญหาในการ deploy หรือใช้งานบอท สามารถติดต่อ:

- **LINE Developers Support**: https://developers.line.biz/support/
- **Google Cloud Support**: https://cloud.google.com/support
- **Gemini API Support**: https://ai.google.dev/support

# LINE Bot "คุยกับธานี" - Deployment Package

นี่คือแพ็คเจจ deploy ที่พร้อมใช้สำหรับ Google Cloud Run

## เนื้อหาของแพ็คเจจ

- `Dockerfile` - Docker configuration สำหรับ Cloud Run
- `.dockerignore` - Files ที่ไม่ต้อง include ใน Docker image
- `DEPLOYMENT_GUIDE.md` - คำแนะนำการ deploy แบบละเอียด
- `QUICK_START_DEPLOY.md` - คำแนะนำการ deploy แบบด่วน (5 นาที)
- `package.json` - Node.js dependencies
- `pnpm-lock.yaml` - Dependency lock file
- `server/` - Backend code
- `client/` - Frontend code
- `drizzle/` - Database schema

## ขั้นตอนการ Deploy

### วิธีที่ 1: ด่วน (5 นาที)

ดู `QUICK_START_DEPLOY.md`

### วิธีที่ 2: ละเอียด

ดู `DEPLOYMENT_GUIDE.md`

## ความต้องการ

1. Google Cloud Account
2. gcloud CLI ติดตั้งแล้ว
3. LINE Channel Credentials
4. Gemini API Key
5. Database (MySQL/TiDB)

## ข้อสำคัญ

- ตรวจสอบ `DEPLOYMENT_GUIDE.md` ก่อน deploy
- ตั้งค่า environment variables ให้ถูกต้อง
- ตั้งค่า Webhook URL ใน LINE Developers Console หลังจาก deploy

## ติดต่อ

หากมีปัญหา ดู `DEPLOYMENT_GUIDE.md` ส่วน "การแก้ไขปัญหา"

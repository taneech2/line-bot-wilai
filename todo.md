# LINE Bot "คุยกับธานี" - TODO

## ฟีเจอร์หลัก
- [x] ติดตั้ง dependencies (axios สำหรับ HTTP requests)
- [x] สร้าง Webhook endpoint (/api/lineBot/webhook) สำหรับรับข้อความจาก LINE
- [x] เพิ่ม LINE signature verification เพื่อความปลอดภัย
- [x] เชื่อมต่อ Gemini AI API เพื่อประมวลผลข้อความ
- [x] สร้าง system prompt สำหรับบุคลิก "ธานี" ที่เป็นกันเอง
- [x] ส่งข้อความตอบกลับไปยัง LINE Messaging API
- [x] ทดสอบระบบ webhook signature verification
- [x] แก้ไข webhook endpoint ให้ return 200 OK สำหรับ LINE verify request
- [x] ปรับปรุง webhook ให้รองรับกลุ่ม LINE แลชตรวจสอบคำว่า "ธานี"
- [x] Debug แลชตรวจสอบคำว่า - แก้ไขใช้ LINE API endpoint ที่ถูกต้อง (api.line.me)
- [x] ปรับปรุง system prompt ให้มีข้อมูลจริงของวิทยาลัย
- [x] เพิ่มข้อมูลผลลูกเสือจาก Google Sheets
- [x] เพิ่มข้อมูลผลกิจกรรม ปวช.1 ปี 2568 จาก OneDrive
- [x] เพิ่มข้อมูลเกรดนักเรียนจาก Google Drive
- [x] ปรับปรุง system prompt ให้บอทเป็นเพศหญิง (ใช้คำว่า "ค่ะ" แทน "ครับ")
- [x] เพิ่มฟีเจอร์ Web Search ให้บอทสามารถค้นหาข้อมูลจากอินเทอร์เน็ต
- [ ] Deploy แลละเปิด Public URL
- [ ] สรุป Webhook URL ให้ผู้ใช้

## Secrets & Configuration
- [x] ตั้งค่า LINE Channel Access Token
- [x] ตั้งค่า LINE Channel Secret
- [x] ตั้งค่า Gemini API Key
- [x] ตั้งค่า Manus Built-in API (BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY)
- [x] เพิ่มข้อมูลคำปฏิญาณ กฎของลูกเสือ และคติพจน์ให้บอทธานี
- [x] เพิ่มความสามารถเตือนเมื่อพบพฤติกรรมที่ไม่สอดคล้องกับกฎของลูกเสือ
- [x] เพิ่มระบบเก็บประวัติแชท (conversation history) ในฐานข้อมูล
- [x] ปรับปรุง Gemini API call ให้ใช้ประวัติแชทเพื่อให้บอทจำบทสนทนาก่อนหน้า
- [x] ทดสอบระบบเก็บประวัติแชท

## Deployment to Google Cloud Run
- [ ] สร้าง Dockerfile สำหรับ Google Cloud Run
- [ ] สร้าง .dockerignore
- [ ] สร้างคำแนะนำการ deploy บน Google Cloud Run
- [ ] แพ็คโค้ดทั้งหมดเป็น zip สำหรับ deploy

# 🚀 PortfolioHub — คู่มือการตั้งค่า

## ขั้นตอนที่ 1 — ตั้งค่า Supabase

### 1.1 รัน SQL Schema
1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก Project ของคุณ
3. คลิก **SQL Editor** (ไอคอน `</>` ทางซ้าย)
4. คัดลอกเนื้อหาจากไฟล์ `supabase_schema.sql` ทั้งหมด
5. วาง แล้วกด **Run**

### 1.2 เปิด Google Auth (ถ้าต้องการ)
1. ไปที่ **Authentication → Providers**
2. เปิด **Google** → ใส่ Client ID + Secret จาก Google Console

### 1.3 สร้าง Storage Buckets (สำหรับรูปภาพ)
1. ไปที่ **Storage**
2. กด **New bucket** → ชื่อ `avatars` เปิด Public
3. กด **New bucket** อีกครั้ง → ชื่อ `projects` เปิด Public

---

## ขั้นตอนที่ 2 — ใส่ API Key

1. ไปที่ Supabase Dashboard → **Settings → API**
2. คัดลอก **anon/public** key
3. เปิดไฟล์ `js/config.js`
4. แทนที่ `YOUR_SUPABASE_ANON_KEY` ด้วย key ที่คัดลอกมา:

```javascript
const SUPABASE_ANON_KEY = 'eyJhbGciOi...'; // ← ใส่ key ตรงนี้
```

---

## ขั้นตอนที่ 3 — เปิดใช้งาน

วิธีง่ายที่สุด: ใช้ **VS Code + Live Server**
1. ติดตั้ง Extension "Live Server" ใน VS Code
2. คลิกขวาที่ `index.html` → **Open with Live Server**

หรืออัพโหลดไฟล์ทั้งหมดขึ้น Static Hosting เช่น:
- [Netlify](https://netlify.com) — ลาก folder วางได้เลย
- [Vercel](https://vercel.com)
- GitHub Pages

---

## โครงสร้างไฟล์

```
portfolio/
├── index.html          # หน้าหลัก (ทุกหน้าอยู่ในไฟล์เดียว)
├── css/
│   └── style.css       # Styles ทั้งหมด
├── js/
│   ├── config.js       # ← ใส่ API Key ตรงนี้
│   ├── auth.js         # Login / Register / Logout
│   ├── projects.js     # CRUD โปรเจกต์
│   ├── skills.js       # CRUD ทักษะ
│   ├── portfolio.js    # หน้า Portfolio สาธารณะ
│   ├── explore.js      # หน้าสำรวจผลงาน
│   └── app.js          # Main controller
└── supabase_schema.sql # SQL สำหรับสร้าง Tables
```

---

## ฟีเจอร์ทั้งหมด

| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| 🔐 Auth | Login, Register, Google OAuth, Auto-profile |
| 📂 Projects | CRUD, Thumbnail, Tech Stack, Featured, Published/Hidden |
| ⚡ Skills | CRUD, Level bar, หมวดหมู่ |
| 👤 Profile | Bio, Title, Location, Social Links, Public/Private |
| ✉️ Contact | ส่งข้อความถึงเจ้าของ Portfolio |
| 📊 Dashboard | Stats: โปรเจกต์, ทักษะ, Views, ข้อความ |
| 🌐 Public Portfolio | URL แสดงผลงานสาธารณะ |
| 🔍 Explore | ค้นหาโปรเจกต์จากทุกคน |

---

## หมายเหตุ

- Project URL: `https://qanqppxfserhquennckn.supabase.co`
- แต่ละคนมี Portfolio URL ของตัวเอง
- รองรับทั้ง Desktop และ Mobile

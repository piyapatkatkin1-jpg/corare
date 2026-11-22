# 💎 corarevanilla Web Store (Minecraft Store)

เว็บไซต์ร้านค้า (Donation & Web Shop) สำหรับเซิร์ฟเวอร์ Minecraft: **corarevanilla SMP**
- **Domain / IP**: `corarevanilla.xyz`
- **Game Mode**: SMP (Survival Multiplayer)
- **Theme Color**: Light Blue (`sky-400` / `cyan-400`)
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + Tailwind CSS + Lucide Icons
- **Database**: รองรับ Firebase Firestore / SQLite (Prisma)
- **Minecraft Integration**: RCON (Vanilla/Paper) & Skript (`link.sk`, `delivery.sk`)

---

## 🚀 ฟีเจอร์หลัก (Features)

1. **โหมดเกม SMP เท่านั้น**: ร้านค้าเฉพาะเซิร์ฟเวอร์ `corarevanilla SMP` พร้อมสินค้า ยศ VIP/MVP, กุญแจ Crate Keys, Claim Blocks, Netherite God Set
2. **ระบบผูกบัญชีเกม ปลอดภัย 100% (/link)**: สุ่มรหัสยืนยัน 5 ตัวอักษร พิมพ์ `/link <รหัส>` ในเกม ยืนยันตัวตนไม่ต้องใช้รหัสผ่าน
3. **ระบบหลังบ้านแอดมิน (Admin Panel)**:
   - **หน้าตั้งค่าระบบทั้งหมด (Admin Configs & RCON)** ที่ `/admin/settings`:
     - ข้อมูลเซิร์ฟเวอร์ (ชื่อร้านค้า, Server IP, ข้อความประกาศ, ลิงก์ Discord, ธีมสี)
     - การเชื่อมต่อ Minecraft RCON (Host, Port, Password พร้อมปุ่มทดสอบการเชื่อมต่อสด)
     - ระบบเติมเงิน TrueMoney Wallet (เบอร์รับเงิน)
     - ความปลอดภัย (Server Secret Key, อายุรหัสยืนยัน)
   - จัดการสินค้า ยศ หมวดหมู่
   - คอนโซลส่งคำสั่ง RCON ตรงเข้าเกม
   - ตรวจสอบประวัติการสั่งซื้อ และประวัติการแลกโค้ด
4. **ระบบเติมเงิน TrueMoney Wallet**: ซองของขวัญ (Gift Voucher) เติม Point อัตโนมัติ
5. **ระบบแลกไอเทมโค้ด (Redeem Code)**: โค้ดแลกรับพ้อยท์และไอเทมในเกม เช่น `CORARE2026`
6. **แสดงผู้ซื้อล่าสุด (Recent Buyers Feed)**: Real-time feed พร้อมสกินผู้เล่นแบบ 3D/Head

---

## ⚙️ การตั้งค่า Firebase Firestore (Database)

โปรเจกต์รองรับ **Firebase Firestore** ตามที่ผู้ใช้ต้องการ:

1. สร้างโปรเจกต์ใน [Firebase Console](https://console.firebase.google.com/)
2. สร้าง Cloud Firestore Database (เลือกโหมด Production หรือ Test)
3. ไปที่ **Project Settings** → **Service Accounts** → คลิก **Generate new private key** เพื่อดาวน์โหลดไฟล์ JSON
4. วางไฟล์เป็น `server/serviceAccountKey.json` หรือใส่ตัวแปรใน `server/.env`:
   ```env
   USE_FIREBASE=true
   FIREBASE_PROJECT_ID="your-project-id"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
5. สั่งรัน Seed ข้อมูลเริ่มต้นเข้า Firebase Firestore:
   ```bash
   cd server
   node scripts/seedFirebase.js
   ```

---

## 🛠️ วิธีการติดตั้งและรันระบบ (Quick Start)

### 1. ติดตั้ง Dependencies
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. รันระบบเซิร์ฟเวอร์
```bash
# Backend (Port 5000)
cd server
npm run dev

# Frontend (Port 5173)
cd ../client
npm run dev
```

### 3. ข้อมูลเข้าสู่ระบบ Admin เริ่มต้น
- **URL**: `http://localhost:5173/admin/login`
- **Username**: `admin`
- **Password**: `admin123456`
- **หน้าตั้งค่า Configs & RCON**: `http://localhost:5173/admin/settings`

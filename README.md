# 📦 Web API สำหรับจัดการลูกค้าและรายการสั่งซื้อ (Customer & Order Management API)

ระบบ Web API แบบแยก Folder อิสระ สำหรับจัดการข้อมูลลูกค้าและการสั่งซื้อข้าวกล่องเดลิเวอรี เชื่อมต่อกับฐานข้อมูล **MySQL** (`smart_delivery`)

---

## 🚀 วิธีการติดตั้งและรันระบบ

### 1. เข้าสู่โฟลเดอร์
```bash
cd d:\ER\customer-order-api
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. สร้าง Prisma Client (เชื่อมต่อ MySQL)
```bash
npx prisma generate
```

### 4. รันระบบ (Development Mode)
```bash
npm run dev
```
เซิร์ฟเวอร์จะเปิดทำงานที่: **http://localhost:5000** (พอร์ต 5000 เพื่อไม่ให้ชนกับระบบหลักพอร์ต 3000)

---

## 📋 เอกสารสรุป Web API Endpoints

### 👤 1. Web API สำหรับจัดการลูกค้า (`/api/customers`)

| Method | Endpoint | รายละเอียด / พารามิเตอร์ |
|---|---|---|
| **GET** | `/api/customers` | แสดงข้อมูลลูกค้าทุกคน (รองรับ `?search=คำค้น`) |
| **GET** | `/api/customers/search?name=...` | **ค้นหาจากส่วนหนึ่งของชื่อ, นามสกุล** เช่น `?name=พลอย` |
| **GET** | `/api/customers/nearby?lat=...&lng=...&radius=1` | **ค้นลูกค้าทั้งหมดในระยะ 1 กิโลเมตร** จากพิกัดที่กำหนด (ค่าเริ่มต้น 1.0 km) |
| **GET** | `/api/customers/:id` | ดูข้อมูลลูกค้ารายบุคคลตาม ID |
| **POST** | `/api/customers` | **เพิ่มลูกค้าใหม่** (ระบุ: `name`, `phone`, `addressDetail`, `latitude`, `longitude`) |
| **PUT/PATCH** | `/api/customers/:id` | **แก้ไขข้อมูลลูกค้า** (ชื่อ, เบอร์โทร, ที่อยู่, พิกัด) |
| **DELETE** | `/api/customers/:id` | **ลบข้อมูลลูกค้า** |

#### ตัวอย่าง Body สำหรับเพิ่ม/แก้ไขลูกค้า:
```json
{
  "name": "น้องพลอย ศิริพร",
  "phone": "081-234-5601",
  "addressDetail": "หอพักเสริมไทย คอมเพล็กซ์ ชั้น 3 ห้อง 305",
  "latitude": 16.252325,
  "longitude": 103.256272
}
```

---

### 🛒 2. Web API สำหรับจัดการรายการสั่งซื้อ (`/api/orders`)

| Method | Endpoint | รายละเอียด / พารามิเตอร์ |
|---|---|---|
| **POST** | `/api/orders/seed?count=25` | **จำลองรายการสั่งซื้อได้ 20-30 รายการ** พร้อมข้อมูลลูกค้าครบถ้วน (ชื่อ, เบอร์, ที่อยู่, พิกัด) และจำนวนกล่อง 1-3 กล่อง |
| **GET** | `/api/orders` | **แสดงรายการสั่งซื้อทั้งหมด** พร้อมข้อมูลลูกค้าที่สั่ง |
| **GET** | `/api/orders/nearby?lat=...&lng=...&radius=2` | **แสดงรายการสั่งซื้อทั้งหมดในระยะ 2 กิโลเมตร** จากพิกัดที่กำหนด (ค่าเริ่มต้น 2.0 km) |
| **GET** | `/api/orders/:id` | ดูรายละเอียดรายการสั่งซื้อราย ID |
| **POST** | `/api/orders` | **เพิ่มรายการสั่งซื้อใหม่** (ระบุ: `customerId`, `boxAmount` 1-3 กล่อง, ระบบคำนวณราคาอัตโนมัติ 65 บาท/กล่อง) |
| **PUT/PATCH** | `/api/orders/:id` | **แก้ไขจำนวนกล่อง** (`boxAmount`: 1-3 กล่อง) โดยระบบคำนวณราคารวมใหม่อัตโนมัติ |
| **DELETE** | `/api/orders/:id` | **ลบรายการสั่งซื้อ** รายรายการ |
| **DELETE** | `/api/orders` | **ล้าง (ลบทั้งหมด) รายการสั่งซื้อที่จำลองทั้งหมดได้** |

#### ตัวอย่าง Body สำหรับเพิ่มรายการสั่งซื้อ:
```json
{
  "customerId": 1,
  "boxAmount": 2
}
```

#### ตัวอย่าง Body สำหรับแก้ไขจำนวนกล่อง:
```json
{
  "boxAmount": 3
}
```
*(ระบบจะคำนวณ `totalPrice` = 3 x 65 = 195.0 บาท ให้อัตโนมัติ)*

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

- **Database**: MySQL / MariaDB (Database name: `smart_delivery`)
- **Table `customers`**:
  - `id` (INT, Auto Increment, PK)
  - `name` (VARCHAR)
  - `phone` (VARCHAR)
  - `address_detail` (TEXT)
  - `latitude` (DOUBLE)
  - `longitude` (DOUBLE)
  - `created_at` (DATETIME)
- **Table `orders`**:
  - `id` (INT, Auto Increment, PK)
  - `customer_id` (INT, FK -> customers.id)
  - `box_amount` (INT, 1-3 กล่อง)
  - `total_price` (DOUBLE, box_amount * 65.0)
  - `status` (VARCHAR, 'PENDING', 'ASSIGNED', 'DELIVERED', 'CANCELLED')
  - `created_at` (DATETIME)

---

## 📐 การคำนวณระยะทาง (Haversine Formula)
ระบบใช้สูตร Haversine คำนวณระยะทางเส้นตรงจากพิกัดละติจูด/ลองจิจูดของร้าน (Hub: `16.246825, 103.252072`) หรือพิกัดที่ผู้ใช้ระบุเข้ามาทาง Query String เพื่อกรองลูกค้าในระยะ **1 กิโลเมตร** และออเดอร์ในระยะ **2 กิโลเมตร** ได้อย่างแม่นยำ

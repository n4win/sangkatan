# สังฆทานออนไลน์ — ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน

ระบบจำหน่ายชุดสังฆทานออนไลน์ พร้อมระบบจัดการหลังบ้านสำหรับผู้ดูแลระบบ พัฒนาด้วย Next.js 16 + Mantine UI + Prisma ORM + MariaDB

---

## สารบัญ

- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [การติดตั้งและตั้งค่า](#การติดตั้งและตั้งค่า)
- [การตั้งค่า Environment Variables](#การตั้งค่า-environment-variables)
- [การตั้งค่าฐานข้อมูล](#การตั้งค่าฐานข้อมูล)
- [การตั้งค่า Google OAuth](#การตั้งค่า-google-oauth)
- [การรันโปรเจกต์ (Development)](#การรันโปรเจกต์-development)
- [การ Build สำหรับ Production](#การ-build-สำหรับ-production)
- [การ Deploy ขึ้น Server](#การ-deploy-ขึ้น-server)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ฟีเจอร์ของระบบ](#ฟีเจอร์ของระบบ)
- [API Routes](#api-routes)
- [ระบบสิทธิ์และความปลอดภัย](#ระบบสิทธิ์และความปลอดภัย)
- [การตั้งค่าผู้ดูแลระบบคนแรก](#การตั้งค่าผู้ดูแลระบบคนแรก)
- [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)

---

## ภาพรวมระบบ

ระบบนี้เป็นเว็บแอปพลิเคชัน E-Commerce สำหรับจำหน่ายชุดสังฆทานออนไลน์ ประกอบด้วย:

- **หน้าร้านค้า (Public)** — แสดงสินค้า, ตะกร้า, สั่งซื้อ, ชำระเงินผ่าน PromptPay, ดูประวัติการสั่งซื้อ, รีวิวสินค้า, กิจกรรม, ประวัติ, ติดต่อ
- **ระบบจัดการหลังบ้าน (Admin)** — Dashboard, จัดการหมวดหมู่/สินค้า/ผู้ใช้/คำสั่งซื้อ/แบนเนอร์/กิจกรรม

---

## เทคโนโลยีที่ใช้

| เทคโนโลยี                 | เวอร์ชัน | หน้าที่                                |
| ------------------------- | -------- | -------------------------------------- |
| **Next.js**               | 16.1.6   | Web Framework (App Router + Turbopack) |
| **React**                 | 19.2.3   | UI Library                             |
| **Mantine UI**            | 8.x      | Component Library + Theme              |
| **Tailwind CSS**          | 4.x      | Utility CSS                            |
| **Prisma ORM**            | 7.x      | Database ORM                           |
| **MariaDB / MySQL**       | 10.x+    | ฐานข้อมูล                              |
| **NextAuth.js (Auth.js)** | v5 beta  | ระบบยืนยันตัวตน (Google OAuth)         |
| **Recharts**              | 3.x      | กราฟและแผนภูมิ (Dashboard)             |
| **Mantine DataTable**     | 8.x      | ตารางข้อมูล (Admin)                    |
| **TypeScript**            | 5.x      | Type Safety                            |

---

## ความต้องการของระบบ

ก่อนเริ่มต้นใช้งาน ต้องติดตั้งโปรแกรมเหล่านี้:

- **Node.js** เวอร์ชัน 18.18 ขึ้นไป (แนะนำ 20.x หรือ 22.x LTS)
- **npm** เวอร์ชัน 9 ขึ้นไป (มาพร้อม Node.js)
- **MariaDB** เวอร์ชัน 10.6 ขึ้นไป หรือ **MySQL** เวอร์ชัน 8.0 ขึ้นไป
- **Git** สำหรับ clone โปรเจกต์

---

## การติดตั้งและตั้งค่า

### 1. Clone โปรเจกต์

```bash
git clone <repository-url>
cd sangkatan
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. คัดลอกไฟล์ Environment Variables

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

### 4. แก้ไขไฟล์ `.env` ตามค่าจริงของคุณ (ดูรายละเอียดด้านล่าง)

---

## การตั้งค่า Environment Variables

แก้ไขไฟล์ `.env` โดยกรอกค่าตามจริง:

```env
# === ฐานข้อมูล ===
DATABASE_URL="mysql://root:รหัสผ่าน@localhost:3306/dbsangkatan"

# ข้อมูลเชื่อมต่อฐานข้อมูล (สำหรับ Prisma MariaDB Adapter)
DATABASE_HOST="localhost"
DATABASE_PORT=3306
DATABASE_USER="root"
DATABASE_PASSWORD="รหัสผ่านของคุณ"
DATABASE_NAME="dbsangkatan"

# === NextAuth.js ===
# สร้าง secret ด้วยคำสั่ง: npx auth secret
AUTH_SECRET="your-generated-secret-key"

# URL ของเว็บไซต์ (ตอน dev ใช้ localhost, production ใช้ domain จริง)
AUTH_URL="http://localhost:3000"

# === Google OAuth ===
# สร้างที่: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### วิธีสร้าง AUTH_SECRET

```bash
npx auth secret
```

คำสั่งนี้จะสร้าง secret key แบบสุ่มและเพิ่มลงในไฟล์ `.env` ให้อัตโนมัติ

---

## การตั้งค่าฐานข้อมูล

### 1. สร้างฐานข้อมูลใน MariaDB / MySQL

```sql
CREATE DATABASE dbsangkatan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. รัน Prisma Migration

```bash
npx prisma migrate dev
```

คำสั่งนี้จะ:

- สร้างตารางทั้งหมดในฐานข้อมูลตาม `prisma/schema.prisma`
- สร้าง Prisma Client ที่ `lib/generated/prisma/`

### 3. (ถ้าต้องการ) ดูฐานข้อมูลผ่าน Prisma Studio

```bash
npx prisma studio
```

จะเปิดหน้าเว็บที่ `http://localhost:5555` สำหรับดูและแก้ไขข้อมูลในฐานข้อมูล

---

## การตั้งค่า Google OAuth

### 1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)

### 2. สร้าง Project ใหม่ (หรือเลือก Project ที่มีอยู่)

### 3. เปิดใช้งาน Google+ API

- ไปที่ **APIs & Services** > **Library**
- ค้นหา **Google+ API** แล้วเปิดใช้งาน

### 4. สร้าง OAuth 2.0 Credentials

- ไปที่ **APIs & Services** > **Credentials**
- คลิก **Create Credentials** > **OAuth client ID**
- เลือก **Web application**
- ตั้งชื่อตามต้องการ

### 5. ตั้งค่า Authorized redirect URIs

สำหรับ **Development**:

```
http://localhost:3000/api/auth/callback/google
```

สำหรับ **Production** (เปลี่ยนเป็น domain จริง):

```
https://yourdomain.com/api/auth/callback/google
```

### 6. คัดลอก Client ID และ Client Secret ไปใส่ในไฟล์ `.env`

---

## การรันโปรเจกต์ (Development)

```bash
npm run dev
```

เปิดเว็บเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

| หน้า                | URL                              |
| ------------------- | -------------------------------- |
| Splash Page         | http://localhost:3000            |
| หน้าแรก             | http://localhost:3000/home       |
| สินค้า              | http://localhost:3000/products   |
| กิจกรรม             | http://localhost:3000/activities |
| ประวัติ             | http://localhost:3000/about      |
| ติดต่อเรา           | http://localhost:3000/contact    |
| เข้าสู่ระบบ         | http://localhost:3000/signin     |
| ตะกร้าสินค้า        | http://localhost:3000/cart       |
| ข้อมูลของฉัน        | http://localhost:3000/profile    |
| การซื้อของฉัน       | http://localhost:3000/orders     |
| **Admin Dashboard** | http://localhost:3000/admin      |

---

## การ Build สำหรับ Production

```bash
npm run build
```

Build สำเร็จจะแสดงรายการ routes ทั้งหมด:

```
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
ƒ  Proxy (Middleware)
```

ทดสอบ production build ในเครื่อง:

```bash
npm run start
```

---

## การ Deploy ขึ้น Server

### ตัวเลือกที่ 1: VPS / Dedicated Server (แนะนำ)

เหมาะกับโปรเจกต์นี้เพราะใช้ Prisma + MariaDB + ไฟล์อัปโหลดเก็บใน `public/uploads/`

#### 1. เตรียม Server

```bash
# ติดตั้ง Node.js 20 LTS (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ติดตั้ง MariaDB
sudo apt install -y mariadb-server
sudo mysql_secure_installation

# ติดตั้ง Nginx (reverse proxy)
sudo apt install -y nginx

# ติดตั้ง PM2 (process manager)
sudo npm install -g pm2
```

#### 2. สร้างฐานข้อมูล

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE dbsangkatan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sangkatan'@'localhost' IDENTIFIED BY 'รหัสผ่านที่แข็งแรง';
GRANT ALL PRIVILEGES ON dbsangkatan.* TO 'sangkatan'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Clone และตั้งค่าโปรเจกต์บน Server

```bash
cd /var/www
git clone <repository-url> sangkatan
cd sangkatan

# ติดตั้ง dependencies
npm install

# สร้างไฟล์ .env
nano .env
```

ใส่ค่า environment variables (**สำคัญ**: เปลี่ยน `AUTH_URL` เป็น domain จริง):

```env
DATABASE_URL="mysql://sangkatan:รหัสผ่าน@localhost:3306/dbsangkatan"
DATABASE_HOST="localhost"
DATABASE_PORT=3306
DATABASE_USER="sangkatan"
DATABASE_PASSWORD="รหัสผ่านที่แข็งแรง"
DATABASE_NAME="dbsangkatan"

AUTH_SECRET="สร้างด้วย npx auth secret"
AUTH_URL="https://yourdomain.com"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### 4. รัน Migration และ Build

```bash
# สร้างตารางในฐานข้อมูล
npx prisma migrate deploy

# Build โปรเจกต์
npm run build
```

> **หมายเหตุ**: ใน production ใช้ `prisma migrate deploy` (ไม่ใช่ `migrate dev`)

#### 5. รันด้วย PM2

```bash
# เริ่มต้น process
pm2 start npm --name "sangkatan" -- start

# บันทึก process list เพื่อให้รันอัตโนมัติหลัง server restart
pm2 save
pm2 startup
```

คำสั่ง PM2 ที่ใช้บ่อย:

```bash
pm2 status              # ดูสถานะ
pm2 logs sangkatan      # ดู logs
pm2 restart sangkatan   # restart
pm2 stop sangkatan      # หยุด
pm2 delete sangkatan    # ลบ process
```

#### 6. ตั้งค่า Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/sangkatan
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # จำกัดขนาดไฟล์อัปโหลด
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# เปิดใช้งาน site
sudo ln -s /etc/nginx/sites-available/sangkatan /etc/nginx/sites-enabled/

# ตรวจสอบ config
sudo nginx -t

# restart nginx
sudo systemctl restart nginx
```

#### 7. ตั้งค่า SSL ด้วย Let's Encrypt (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot จะตั้งค่า HTTPS อัตโนมัติและ auto-renew certificate

#### 8. สร้างโฟลเดอร์อัปโหลด (ถ้ายังไม่มี)

```bash
mkdir -p /var/www/sangkatan/public/uploads/{banner,product,activity,slip,proof}
```

---

### ตัวเลือกที่ 2: Docker

สร้างไฟล์ `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Production ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# สร้างโฟลเดอร์อัปโหลด
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

> **หมายเหตุ**: ถ้าใช้ Docker ต้องเพิ่ม `output: "standalone"` ใน `next.config.ts`

สร้างไฟล์ `docker-compose.yml`:

```yaml
services:
  db:
    image: mariadb:10.11
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: dbsangkatan
      MYSQL_USER: sangkatan
      MYSQL_PASSWORD: yourpassword
    volumes:
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"

  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - db
    env_file:
      - .env

volumes:
  db_data:
```

```bash
docker compose up -d
```

---

### ตัวเลือกที่ 3: Vercel

> **ข้อจำกัด**: Vercel ไม่รองรับ persistent file storage ดังนั้นระบบอัปโหลดรูปภาพ (`public/uploads/`) จะไม่ทำงาน ต้องเปลี่ยนไปใช้ cloud storage เช่น AWS S3, Cloudinary ก่อน

```bash
npm install -g vercel
vercel
```

ตั้งค่า environment variables ใน Vercel Dashboard และเชื่อมต่อ database ภายนอก (เช่น PlanetScale, Aiven)

---

## โครงสร้างโปรเจกต์

```
sangkatan/
├── app/                          # Next.js App Router
│   ├── (admin)/admin/            # หน้า Admin (Dashboard, จัดการข้อมูลต่างๆ)
│   ├── (auth)/signin/            # หน้าเข้าสู่ระบบ
│   ├── (public)/                 # หน้าสาธารณะ (สินค้า, กิจกรรม, ตะกร้า, etc.)
│   ├── api/                      # API Routes
│   │   ├── admin/                #   - Admin APIs (ต้องเป็น ADMIN เท่านั้น)
│   │   ├── auth/                 #   - NextAuth.js handler
│   │   ├── cart/                 #   - ตะกร้าสินค้า
│   │   ├── checkout/             #   - สร้างคำสั่งซื้อ
│   │   ├── reviews/              #   - รีวิวสินค้า
│   │   ├── upload/               #   - อัปโหลดรูปภาพ
│   │   └── user/                 #   - ข้อมูลผู้ใช้ + คำสั่งซื้อ
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout (Mantine + Auth providers)
│   ├── page.tsx                  # Splash page (/)
│   ├── theme.ts                  # Mantine theme config
│   ├── robots.ts                 # SEO robots
│   └── sitemap.ts                # SEO sitemap (dynamic)
│
├── components/
│   ├── admin/                    # Admin components
│   │   ├── dashboard/            #   - Dashboard (charts, stats)
│   │   ├── categories/           #   - จัดการหมวดหมู่
│   │   ├── products/             #   - จัดการสินค้า
│   │   ├── users/                #   - จัดการผู้ใช้
│   │   ├── orders/               #   - จัดการคำสั่งซื้อ
│   │   ├── banners/              #   - จัดการแบนเนอร์
│   │   ├── activities/           #   - จัดการกิจกรรม
│   │   ├── admin-shell.tsx       #   - Layout หลัก (sidebar + header)
│   │   └── image-upload.tsx      #   - Component อัปโหลดรูปภาพ
│   ├── auth/                     # Auth components (sign-in)
│   └── public/                   # Public components (navbar, footer, pages)
│
├── lib/
│   ├── auth.ts                   # NextAuth.js configuration
│   ├── auth.d.ts                 # Type declarations (Session + JWT)
│   ├── prisma.ts                 # Prisma Client instance
│   ├── admin-auth.ts             # Admin auth helper (requireAdmin)
│   └── generated/prisma/         # Prisma generated client
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
│
├── public/                       # Static assets
│   ├── icon/                     # Logo
│   ├── img/                      # Banner images
│   └── uploads/                  # User uploaded images (runtime)
│       ├── banner/
│       ├── product/
│       ├── activity/
│       ├── slip/
│       └── proof/
│
├── utils/
│   ├── cartEvents.ts             # Cart update events (cross-component)
│   └── notificationService.ts    # Notification helper
│
├── styles/                       # CSS Modules
├── proxy.ts                      # Next.js 16 Proxy (auth + admin protection)
├── next.config.ts                # Next.js configuration
├── .env.example                  # ตัวอย่าง environment variables
└── package.json
```

---

## ฟีเจอร์ของระบบ

### หน้าร้านค้า (Public)

| ฟีเจอร์                | รายละเอียด                                                                     |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Splash Page**        | หน้าแรกพร้อมปุ่มเข้าสู่หน้าสินค้า                                              |
| **หน้าแรก**            | แบนเนอร์ carousel, สินค้าแนะนำ, กิจกรรมล่าสุด                                  |
| **รายการสินค้า**       | กรองตามหมวดหมู่, แสดงรูปสินค้า, ราคา                                           |
| **รายละเอียดสินค้า**   | แกลเลอรี่รูปภาพ + lightbox, รีวิว, เพิ่มลงตะกร้า                               |
| **ตะกร้าสินค้า**       | เลือก/ยกเลิกสินค้า, ปรับจำนวน, ตรวจสอบ stock แบบ real-time                     |
| **สั่งซื้อ**           | กรอกที่อยู่จัดส่ง (pre-fill จาก profile), ยืนยันคำสั่งซื้อ                     |
| **ชำระเงิน**           | แสดง QR Code PromptPay, อัปโหลดสลิป                                            |
| **ประวัติการสั่งซื้อ** | ดูสถานะ, ข้อมูลจัดส่ง, tracking number, หลักฐานการถวาย                         |
| **ยกเลิกคำสั่งซื้อ**   | ยกเลิกได้เฉพาะสถานะ "รอดำเนินการ" + คืน stock อัตโนมัติ                        |
| **รีวิวสินค้า**        | รีวิวได้เฉพาะผู้ที่ซื้อและได้รับสินค้าแล้ว                                     |
| **โปรไฟล์**            | แก้ไขชื่อ, เบอร์โทร, ที่อยู่จัดส่ง                                             |
| **กิจกรรม**            | ดูรายการกิจกรรมและรายละเอียด + แกลเลอรี่                                       |
| **ประวัติ / ติดต่อ**   | ข้อมูลชมรม, Google Maps                                                        |
| **SEO**                | Metadata, sitemap.xml, robots.txt, JSON-LD (Organization, Product, Breadcrumb) |

### ระบบจัดการหลังบ้าน (Admin)

| ฟีเจอร์              | รายละเอียด                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Dashboard**        | สรุปยอดขาย, กราฟรายเดือน/รายวัน, ออเดอร์ล่าสุด, สินค้าใกล้หมด, สมาชิกใหม่           |
| **จัดการหมวดหมู่**   | เพิ่ม/แก้ไข/ลบ หมวดหมู่สินค้า + รูปภาพ                                              |
| **จัดการสินค้า**     | เพิ่ม/แก้ไข/ลบ สินค้า, อัปโหลดรูปหลายรูป, ตั้งสินค้าแนะนำ                           |
| **จัดการผู้ใช้**     | ดูรายการผู้ใช้, เปลี่ยน role (USER/ADMIN), แก้ไข/ลบผู้ใช้                           |
| **จัดการคำสั่งซื้อ** | เปลี่ยนสถานะ, ใส่ข้อมูลจัดส่ง (carrier + tracking), ตรวจสอบสลิป, อัปโหลดหลักฐานถวาย |
| **จัดการแบนเนอร์**   | เพิ่ม/แก้ไข/ลบ แบนเนอร์หน้าแรก, เรียงลำดับ                                          |
| **จัดการกิจกรรม**    | เพิ่ม/แก้ไข/ลบ กิจกรรม + แกลเลอรี่รูปภาพ                                            |

---

## API Routes

### Admin APIs (ต้องเป็น ADMIN เท่านั้น)

| Method         | Route                        | หน้าที่                |
| -------------- | ---------------------------- | ---------------------- |
| GET            | `/api/admin/dashboard`       | ข้อมูล Dashboard       |
| GET/POST       | `/api/admin/categories`      | รายการ / สร้างหมวดหมู่ |
| PUT/DELETE     | `/api/admin/categories/[id]` | แก้ไข / ลบหมวดหมู่     |
| GET/POST       | `/api/admin/products`        | รายการ / สร้างสินค้า   |
| GET/PUT/DELETE | `/api/admin/products/[id]`   | ดู / แก้ไข / ลบสินค้า  |
| GET            | `/api/admin/users`           | รายการผู้ใช้           |
| GET/PUT/DELETE | `/api/admin/users/[id]`      | ดู / แก้ไข / ลบผู้ใช้  |
| GET            | `/api/admin/orders`          | รายการคำสั่งซื้อ       |
| GET/PUT        | `/api/admin/orders/[id]`     | ดู / อัปเดตคำสั่งซื้อ  |
| GET/POST       | `/api/admin/banners`         | รายการ / สร้างแบนเนอร์ |
| PUT/DELETE     | `/api/admin/banners/[id]`    | แก้ไข / ลบแบนเนอร์     |
| GET/POST       | `/api/admin/activities`      | รายการ / สร้างกิจกรรม  |
| GET/PUT/DELETE | `/api/admin/activities/[id]` | ดู / แก้ไข / ลบกิจกรรม |

### Public APIs (ต้อง login)

| Method                | Route                           | หน้าที่                |
| --------------------- | ------------------------------- | ---------------------- |
| GET/POST/PATCH/DELETE | `/api/cart`                     | จัดการตะกร้า           |
| GET                   | `/api/cart/count`               | จำนวนสินค้าในตะกร้า    |
| DELETE                | `/api/cart/[itemId]`            | ลบสินค้าจากตะกร้า      |
| POST                  | `/api/checkout`                 | สร้างคำสั่งซื้อ        |
| GET/PATCH             | `/api/user/profile`             | ดู / แก้ไขข้อมูลผู้ใช้ |
| GET                   | `/api/user/orders`              | คำสั่งซื้อของฉัน       |
| PATCH                 | `/api/user/orders/[id]/cancel`  | ยกเลิกคำสั่งซื้อ       |
| PATCH                 | `/api/user/orders/[id]/payment` | อัปโหลดสลิป            |
| GET/POST              | `/api/reviews`                  | ดู / สร้างรีวิว        |
| GET                   | `/api/reviews/check`            | ตรวจสอบสิทธิ์รีวิว     |
| POST/DELETE           | `/api/upload`                   | อัปโหลด / ลบรูปภาพ     |

---

## ระบบสิทธิ์และความปลอดภัย

| ระดับ                | การป้องกัน                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Proxy (proxy.ts)** | ป้องกันหน้า `/admin/*` — ต้อง login + role ADMIN เท่านั้น                           |
| **Admin API Routes** | ทุก endpoint ตรวจสอบ auth + role ADMIN ผ่าน `requireAdmin()`                        |
| **User API Routes**  | ตรวจสอบ `auth()` session — ต้อง login                                               |
| **Upload API**       | POST ต้อง login, DELETE ต้องเป็น ADMIN                                              |
| **Public Pages**     | Client-side redirect ไปหน้า login ถ้ายังไม่ login (cart, checkout, orders, profile) |

---

## การตั้งค่าผู้ดูแลระบบคนแรก

หลังจาก deploy เสร็จ ให้ทำตามขั้นตอนนี้:

### 1. เข้าสู่ระบบด้วย Google Account ที่ต้องการเป็น Admin

เข้าเว็บไซต์แล้วกดปุ่ม "เข้าสู่ระบบด้วย Google"

### 2. เปลี่ยน role เป็น ADMIN ในฐานข้อมูล

```sql
-- ดู user ทั้งหมด
SELECT id, name, email, role FROM users;

-- เปลี่ยน role เป็น ADMIN (ใส่ email ที่ถูกต้อง)
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@gmail.com';
```

หรือใช้ Prisma Studio:

```bash
npx prisma studio
```

ไปที่ตาราง `User` แล้วเปลี่ยน `role` จาก `USER` เป็น `ADMIN`

### 3. เข้าสู่หน้า Admin ได้ที่ `/admin`

หลังจากเปลี่ยน role แล้ว ต้อง sign out แล้ว sign in ใหม่เพื่อให้ JWT อัปเดต role

---

## คำสั่งที่ใช้บ่อย

```bash
# === Development ===
npm run dev                    # รัน dev server (http://localhost:3000)
npm run build                  # Build production
npm run start                  # รัน production server
npm run lint                   # ตรวจสอบ ESLint

# === Prisma ===
npx prisma migrate dev         # สร้าง migration ใหม่ (development)
npx prisma migrate deploy      # รัน migration (production)
npx prisma migrate reset       # ล้างฐานข้อมูลและรัน migration ใหม่ทั้งหมด
npx prisma generate            # สร้าง Prisma Client ใหม่
npx prisma studio              # เปิด GUI ดูฐานข้อมูล
npx prisma db push             # Push schema ไปยังฐานข้อมูลโดยไม่สร้าง migration

# === Auth ===
npx auth secret                # สร้าง AUTH_SECRET

# === PM2 (Production) ===
pm2 start npm --name "sangkatan" -- start
pm2 restart sangkatan
pm2 logs sangkatan
pm2 status
```

---

## สถานะคำสั่งซื้อ (Order Flow)

```
PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
   ↓
CANCELLED (คืน stock อัตโนมัติ)
```

| สถานะ        | ความหมาย           | ใครเปลี่ยน                              |
| ------------ | ------------------ | --------------------------------------- |
| `PENDING`    | รอชำระเงิน         | ระบบ (ตอนสร้าง order)                   |
| `PAID`       | ชำระแล้ว รอตรวจสอบ | ระบบ (หลังอัปโหลดสลิป)                  |
| `PROCESSING` | กำลังจัดเตรียม     | Admin                                   |
| `SHIPPED`    | จัดส่งแล้ว         | Admin                                   |
| `DELIVERED`  | ได้รับสินค้าแล้ว   | Admin                                   |
| `CANCELLED`  | ยกเลิก             | User (เฉพาะ PENDING) / Admin (ทุกสถานะ) |

---

## License

สงวนลิขสิทธิ์ © 2025 ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน

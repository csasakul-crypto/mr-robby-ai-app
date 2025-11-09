# --- STAGE 1: Build Stage (สร้างไฟล์) ---
# 1. เลือก Base Image (Node.js) สำหรับการ "Build"
FROM node:20-alpine AS build

# 2. ตั้งค่าโฟลเดอร์ทำงาน
WORKDIR /app

# 3. คัดลอก package.json และติดตั้ง
COPY package*.json ./
RUN npm install

# 4. คัดลอกโค้ด Vue ทั้งหมด
COPY . .

# 5. สั่ง "Build" โปรเจกต์ (Vite จะสร้างโฟลเดอร์ /dist)
RUN npm run build

# --- STAGE 2: Production Stage (เสิร์ฟไฟล์) ---
# 6. เลือก Base Image (Nginx) สำหรับการ "เสิร์ฟ"
FROM nginx:alpine

# 7. คัดลอกไฟล์ที่ Build เสร็จแล้ว (โฟลเดอร์ /dist) จาก STAGE 1
# มาใส่ในโฟลเดอร์ default ของ Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# 8. (Optional) คัดลอกไฟล์ Config ของ Nginx (ถ้ามี)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 9. บอก Docker ว่า Container นี้จะทำงานที่ Port 80
EXPOSE 80

# 10. คำสั่งรัน Nginx (จะทำงานอัตโนมัติ)
CMD ["nginx", "-g", "daemon off;"]
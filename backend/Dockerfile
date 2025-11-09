# 1. เลือก Base Image (ระบบปฏิบัติการ + Node.js)
FROM node:18-alpine

# 2. ตั้งค่าโฟลเดอร์ทำงานใน Container
WORKDIR /usr/src/app

# 3. คัดลอก "เฉพาะ" package.json เพื่อติดตั้ง dependencies
# (วิธีนี้ช่วยให้ Docker ใช้ Cache ได้ ถ้า package.json ไม่เปลี่ยน)
COPY package*.json ./
RUN npm install

# 4. คัดลอกไฟล์โค้ดทั้งหมดในโฟลเดอร์ backend เข้าไป
COPY . .

# 5. บอก Docker ว่า Container นี้จะทำงานที่ Port 3000
EXPOSE 3000

# 6. คำสั่งที่จะรันเมื่อ Container เริ่มทำงาน
CMD [ "node", "server.js" ]
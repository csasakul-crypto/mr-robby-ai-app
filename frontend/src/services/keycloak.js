// frontend/src/services/keycloak.js
import Keycloak from 'keycloak-js';

// 1. ตั้งค่าการเชื่อมต่อ
const keycloakOptions = {
    url: 'http://localhost:8080/auth/', // URL ที่คุณใช้เข้าหน้า Admin
    realm: 'mr-robby-ai',            // Realm ที่เราสร้าง
    clientId: 'frontend-app'           // Client ID ที่เราสร้าง
};

// 2. สร้าง Instance ของ Keycloak
const keycloak = new Keycloak(keycloakOptions);

// 3. ส่งออกไปให้ไฟล์อื่นใช้
export default keycloak;
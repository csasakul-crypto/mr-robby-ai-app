// frontend/src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import keycloak from './services/keycloak.js';

// --- VVV (แก้ไข) ---
// 1. Import Library CSS (CoreUI)
import 'bootstrap/dist/css/bootstrap.min.css';
import '@coreui/coreui/dist/css/coreui.min.css';

// 2. (ลบ) 'import './styles/main.css';' ออกจากตรงนี้แล้ว
// --- ^^^ ----------------- ^^^

// CoreUI components (เหมือนเดิม)
import { CIcon } from '@coreui/icons-vue';
import { 
  cilMenu, 
  cilSpeedometer, 
  cilSettings, 
  cilChatBubble,
  cilAccountLogout 
} from '@coreui/icons';

keycloak.init({
    onLoad: 'check-sso',
    check3pCookies: false
})
.then((authenticated) => {
    // ... (โค้ด router.beforeEach เหมือนเดิม) ...
    router.beforeEach((to, from, next) => {
        if (to.meta.requiresAuth) { 
            if (authenticated) {
                next();
            } else {
                keycloak.login({
                    redirectUri: window.location.origin + to.path
                });
            }
        } else {
            next();
        }
    });

    // 6. สร้างและเปิดแอป Vue
    const app = createApp(App);
    app.use(router); 
    app.provide('keycloak', keycloak);
    app.component('CIcon', CIcon);
    
    app.provide('icons', {
      cilMenu,
      cilSpeedometer,
      cilSettings,
      cilChatBubble,
      cilAccountLogout
    });

    app.mount('#app');

})
.catch(() => {
    console.error("Authentication failed!");
});
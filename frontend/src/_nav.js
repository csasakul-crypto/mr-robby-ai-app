// frontend/src/_nav.js
import { cilSpeedometer, cilSettings, cilChatBubble } from '@coreui/icons'

export const nav = [
  {
    component: 'CNavItem',
    name: 'Launcher',
    to: '/', // ลิงก์ไปหน้า Launcher.vue
    icon: cilSpeedometer,
  },
  {
    component: 'CNavItem',
    name: 'Chat (Test)',
    to: '/chat', // ลิงก์ไปหน้า ChatView.vue
    icon: cilChatBubble,
  },
  {
    component: 'CNavItem',
    name: 'Settings',
    to: '/settings', // ลิงก์ไปหน้า Settings.vue
    icon: cilSettings,
  },
]
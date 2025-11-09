// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Launcher from '../views/Launcher.vue'
import ChatView from '../views/ChatView.vue'
import Settings from '../views/Settings.vue'
import keycloak from '../services/keycloak'

const routes = [
  {
    path: '/',
    name: 'Launcher',
    component: Launcher,
  },
  {
    path: '/chat',
    name: 'Chat',
    component: ChatView,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.matched.some((r) => r.meta.requiresAuth)) {
    if (!keycloak.authenticated) {
      keycloak.login({
        redirectUri: window.location.origin + to.fullPath,
      })
      return
    }
  }
  next()
})

export default router

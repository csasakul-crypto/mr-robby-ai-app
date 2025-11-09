<template>
  <!-- Admin Layout: ใช้เฉพาะหน้า /settings -->
  <div v-if="isAdminRoute">
    <CSidebar
      position="fixed"
      :visible="sidebarVisible"
      @visible-change="(val) => (sidebarVisible = val)"
    >
      <AppSidebarNav :items="nav" />
    </CSidebar>

    <div class="wrapper d-flex flex-column min-vh-100 bg-light">
      <CHeader position="sticky" class="mb-4 border-bottom">
        <CHeaderToggler class="px-3" @click="toggleSidebar">
          <span class="navbar-toggler-icon"></span>
        </CHeaderToggler>

        <CHeaderBrand class="mx-auto d-md-none fw-bold">
          Mr. Robby Admin
        </CHeaderBrand>

        <CHeaderNav class="ms-auto me-3">
          <CNavItem class="d-flex align-items-center">
            <span
              v-if="organizationLabel"
              class="me-3 text-muted small"
            >
              {{ organizationLabel }}
            </span>

            <CDropdown variant="nav-item">
              <CDropdownToggle
                placement="bottom-end"
                class="py-0 pe-0 d-flex align-items-center"
              >
                <CAvatar
                  color="secondary"
                  text-color="white"
                  size="md"
                  class="me-2"
                >
                  {{ userInitials }}
                </CAvatar>
                <span class="d-none d-md-inline fw-semibold">
                  {{ username || 'Admin' }}
                </span>
              </CDropdownToggle>

              <CDropdownMenu class="pt-0">
                <CDropdownHeader class="bg-light fw-semibold py-2">
                  Signed in as {{ username || 'Admin' }}
                </CDropdownHeader>
                <CDropdownItem @click="logout">
                  Log out
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </CNavItem>
        </CHeaderNav>
      </CHeader>

      <div class="body flex-grow-1 px-3">
        <CContainer fluid>
          <RouterView />
        </CContainer>
      </div>
    </div>
  </div>

  <!-- Legacy Layout: หน้าเด็ก เช่น / และ /chat -->
  <div v-else class="legacy-layout">
    <RouterView />
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import {
  CContainer,
  CSidebar,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CHeaderBrand,
  CAvatar,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownHeader,
  CDropdownItem,
  CNavItem,
} from '@coreui/vue'

import { nav } from '@/_nav'          // ✅ แก้เป็น named import
import { AppSidebarNav } from '@/components/AppSidebarNav'

const route = useRoute()
const keycloak = inject('keycloak', null)

const sidebarVisible = ref(true)

const isAdminRoute = computed(() => route.path.startsWith('/settings'))

const username = computed(() => {
  if (!keycloak || !keycloak.tokenParsed) return ''
  return (
    keycloak.tokenParsed.preferred_username ||
    keycloak.tokenParsed.name ||
    ''
  )
})

const organizationLabel = computed(() => {
  if (!keycloak || !keycloak.tokenParsed) return ''
  return (
    keycloak.tokenParsed.organization ||
    keycloak.tokenParsed.realm ||
    ''
  )
})

const userInitials = computed(() => {
  if (!username.value) return 'U'
  return username.value.charAt(0).toUpperCase()
})

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

const logout = () => {
  if (keycloak) {
    keycloak.logout({ redirectUri: window.location.origin })
  }
}
</script>

<style>
.wrapper {
  margin-left: 0;
}

@media (min-width: 992px) {
  .wrapper {
    margin-left: 256px; /* ความกว้าง sidebar CoreUI มาตรฐาน */
  }
}
</style>

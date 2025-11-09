// src/components/AppSidebarNav.js
import { h } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { CNavGroup, CNavItem, CNavTitle, CSidebarNav } from '@coreui/vue'

export const AppSidebarNav = {
  name: 'AppSidebarNav',
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const route = useRoute()

    const renderLink = (item) => {
      const children = []

      if (item.icon) {
        children.push(h('CIcon', { class: 'nav-icon', icon: item.icon }))
      }

      children.push(item.name)

      if (item.to) {
        return h(
          RouterLink,
          {
            to: item.to,
            class: 'nav-link',
          },
          {
            default: () => children,
          },
        )
      }

      return children
    }

    const renderItem = (item) => {
      if (item.component === 'CNavItem') {
        return h(
          CNavItem,
          {},
          {
            default: () => renderLink(item),
          },
        )
      }

      if (item.component === 'CNavTitle') {
        return h(
          CNavTitle,
          {},
          {
            default: () => item.name,
          },
        )
      }

      if (item.component === 'CNavGroup') {
        return h(
          CNavGroup,
          {
            visible: item.items?.some((child) =>
              child.to ? route.path.startsWith(child.to) : false,
            ),
          },
          {
            togglerContent: () => [
              item.icon &&
                h('CIcon', { class: 'nav-icon', icon: item.icon }),
              item.name,
            ],
            default: () => item.items.map((child) => renderItem(child)),
          },
        )
      }

      return null
    }

    return () =>
      h(
        CSidebarNav,
        {},
        {
          default: () => props.items.map((item) => renderItem(item)),
        },
      )
  },
}

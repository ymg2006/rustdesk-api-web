import { defineStore, acceptHMRUpdate } from 'pinia'
import { lastRoutes, asyncRoutes, router } from '@/router'

function filterRoute (routes, enableNames) {
  return routes.filter(route => {
    if (route.children && route.children.length) {
      return enableNames.includes(route.name) || route.children.some(r => enableNames.includes(r.name))
    } else {
      return enableNames.includes(route.name)
    }
  }).map(route => {
    if (route.children && route.children.length) {
      return {
        ...route,
        children: filterRoute(route.children, enableNames),
      }
    } else {
      return { ...route }
    }
  })
}

function collectRouteNames (routes, names = []) {
  for (const route of routes) {
    if (route.children?.length) {
      collectRouteNames(route.children, names)
    }

    if (route.name) {
      names.push(route.name)
    }
  }

  return names
}

export const useRouteStore = defineStore({
  id: 'router',
  state: () => ({
    routes: [],
    activeRoute: '',
    loaded: 0,
    keepAlive: [],
  }),
  actions: {
    addRoutes (accessRouteNames) {
      if (accessRouteNames.includes('*')) {
        this.routes = asyncRoutes
      } else {
        this.routes = filterRoute(asyncRoutes, accessRouteNames)
      }

      this.routes.forEach(route => {
        router.addRoute(route)
      })
      lastRoutes.forEach(route => {
        router.addRoute(route)
      })
      this.addKeepAlive(this.routes)
    },
    addKeepAlive (route) {
      if (route instanceof Array) {
        route.forEach(r => {
          this.addKeepAlive(r)
        })
      } else if (route.children && route.children.length) {
        this.addKeepAlive(route.children)
      } else if (route.meta?.keepAlive && !this.keepAlive.includes(route.name)) {
        this.keepAlive.push(route.name)
      }
    },
    resetRoutes () {
      const names = collectRouteNames(this.routes)

      for (const name of names.reverse()) {
        if (router.hasRoute(name)) {
          router.removeRoute(name)
        }
      }

      this.$reset()
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRouteStore, import.meta.hot))
}

import { defineStore, acceptHMRUpdate } from 'pinia'
import { current, login } from '@/api/user'
import { removeToken, setCode, removeCode } from '@/utils/auth'
import request from '@/utils/request'
import { useRouteStore } from '@/store/router'
import { useAppStore } from '@/store/app'
import { oidcAuth, oidcQuery } from '@/api/login'

export const useUserStore = defineStore({
  id: 'user',
  state: () => ({
    nickname: '',
    username: '',
    email: '',
    token: '',
    role: '',
    avatar: '',
    route_names: [],
    mfa_enabled: false,
  }),

  actions: {
    async logout () {
      // Call backend /logout to clear the HttpOnly Cookie and user_token record
      try {
        await request({ url: '/logout', method: 'post' })
      } catch (e) {
        // Continue clearing local state even if the request fails
      }
      removeToken()
      removeCode()
      this.$patch({
        name: '',
        role: {},
      })
    },

    saveUserData (userData) {
      // The token is issued by the backend via HttpOnly Cookie; the frontend no longer stores it
      localStorage.setItem('user_info', JSON.stringify({ name: userData.username }))
      this.$patch({
        ...userData,
      })
      if (userData.route_names && userData.route_names.length) {
        useRouteStore().addRoutes(userData.route_names)
      }
    },

    async login (form) {
      const res = await login(form).catch(e => e)
      console.log('login', res)
      if (!res.code) {
        useAppStore().loadConfig()
        const userData = res.data
        this.saveUserData(userData)
        return userData
      } else {
        return Promise.reject(res)
      }
    },
    async info () {
      const res = await current().catch(_ => false)
      if (res) {
        useAppStore().loadConfig()
        const userData = res.data
        // The token is issued by the backend via HttpOnly Cookie; the frontend no longer stores it
        this.$patch({
          ...userData,
        })
        useRouteStore().addRoutes(userData.route_names)
        return userData
      }
      return false
    },
    async oidc (provider, platform, browser) {
      // oidc data need to be implement
      const data = {
        deviceInfo: {
          name: navigator.userAgent, // Use the browser User-Agent as the device name
          os: platform, // Get operating-system information
          type: 'webadmin', // any vaule
        },
        id: `${platform}-${browser}`,
        op: provider, // Incoming provider
        uuid: '',//crypto.randomUUID(), // Auto-generate UUID
      }
      const res = await oidcAuth(data).catch(_ => false)
      if (res) {
        const { code, url } = res.data
        setCode(code)
        if (provider == 'webauth') {
          window.open(url)
        } else {
          window.location.href = url
        }
      }
    },
    async query (code) {
      const params = { 'code': code, uuid: '' }
      const res = await oidcQuery(params).catch(_ => false)
      if (res) {
        removeCode()
        useAppStore().loadConfig()
        const userData = res.data
        this.saveUserData(userData)
        return userData
      }
      return false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}

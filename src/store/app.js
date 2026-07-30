import { defineStore, acceptHMRUpdate } from 'pinia'
import logo from '@/assets/logo.png'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import ko from 'element-plus/es/locale/lang/ko'
import ru from 'element-plus/es/locale/lang/ru'
import fr from 'element-plus/es/locale/lang/fr'
import es from 'element-plus/es/locale/lang/es'
import zhTw from 'element-plus/es/locale/lang/zh-tw'
import { admin, app, server } from '@/api/config'
const langs = {
  'zh-CN': { name: 'Chinese Simplified', value: zhCn, sideBarWidth: '210px' },
  'en': { name: 'English', value: en, sideBarWidth: '230px' },
  'fr': { name: 'Français', value: fr, sideBarWidth: '280px' },
  'ko': { name: '한국어', value: ko, sideBarWidth: '230px' },
  'ru': { name: 'Русский', value: ru, sideBarWidth: '250px' },
  'es': { name: 'Español', value: es, sideBarWidth: '280px' },
  'zh-TW': { name: 'Chinese Traditional', value: zhTw, sideBarWidth: '210px' },
}

export function resolveLang (lang) {
  if (!lang || typeof lang !== 'string') {
    return 'en'
  }

  const normalized = lang.replace('_', '-')
  if (langs[normalized]) {
    return normalized
  }

  const lower = normalized.toLowerCase()

  if (
    lower === 'zh-tw' ||
    lower === 'zh-hk' ||
    lower === 'zh-mo' ||
    lower.startsWith('zh-hant')
  ) {
    return 'zh-TW'
  }

  if (lower.startsWith('zh')) {
    return 'zh-CN'
  }

  const baseLang = lower.split('-')[0]
  const supportedLang = Object.keys(langs).find(
    supported => supported.toLowerCase() === baseLang,
  )

  return supportedLang || 'en'
}

const defaultLang = resolveLang(localStorage.getItem('lang') || navigator.language)
export const useAppStore = defineStore({
  id: 'App',
  state: () => ({
    setting: {
      title: 'RustDesk',
      hello: '',
      sideIsCollapse: false,
      logo,
      langs: langs,
      lang: defaultLang,
      locale: langs[defaultLang],
      appConfig: {
        web_client: 1,
      },
      rustdeskConfig: {
        'id_server': '',
        'key': '',
        'relay_server': '',
        'api_server': '',
      },
    },
  }),
  actions: {
    sideCollapse () {
      this.setting.sideIsCollapse = !this.setting.sideIsCollapse
    },
    setLang (lang) {
      const resolvedLang = resolveLang(lang)
      this.setting.lang = resolvedLang
      this.setting.locale = langs[resolvedLang]
      localStorage.setItem('lang', resolvedLang)
    },
    changeLang (v) {
      this.setLang(v)
    },
    loadConfig () {
      this.getAppConfig()
      this.getAdminConfig()
      this.loadRustdeskConfig()
    },
    getAppConfig () {
      return app().then(res => {
        this.setting.appConfig = res.data
      })
    },
    getAdminConfig () {
      return admin().then(res => {
        this.replaceAdminTitle(res.data.title)
        this.setting.hello = res.data.hello
      })
    },
    replaceAdminTitle (newTitle) {
      document.title = document.title.replace(`- ${this.setting.title}`, `- ${newTitle}`)
      this.setting.title = newTitle
    },
    async loadRustdeskConfig () {
      const res = await server().catch(_ => false)
      if (res) {
        this.setting.rustdeskConfig = res.data
        const prefix = 'wc-'
        localStorage.setItem(`${prefix}custom-rendezvous-server`, res.data.id_server)
        localStorage.setItem(`${prefix}key`, res.data.key)
        localStorage.setItem(`${prefix}api-server`, res.data.api_server)
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot))
}

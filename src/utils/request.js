import axios from 'axios'
import { ElMessage } from 'element-plus'
import { removeToken } from '@/utils/auth'
import { useAppStore } from '@/store/app'

// create an axios instance
const service = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API,
  withCredentials: true, // send cookies when cross-domain requests
  timeout: 50000, // request timeout
})

function showBusinessError (res) {
  ElMessage({
    message: res?.message || 'error',
    type: 'error',
    duration: 5 * 1000,
  })
}

function redirectToLogin () {
  removeToken()
  // Session invalid (not logged in / Cookie expired / fingerprint mismatch): redirect to login.
  // Do not call window.location.reload(): protected pages can get stuck in a 403 reload loop.
  import('@/router').then(m => {
    const r = m.default
    const cur = r.currentRoute.value
    if (cur.path !== '/login' && cur.path !== '/register') {
      r.push(`/login?redirect=${encodeURIComponent(cur.fullPath)}`)
    }
  }).catch(() => {
    if (!window.location.hash.includes('/login') && window.location.pathname !== '/login') {
      window.location.href = '/#/login'
    }
  })
}

function handleBusinessResponse (res) {
  if (Array.isArray(res)) {
    return res
  }

  if (res?.code !== 0) {
    showBusinessError(res)

    if (res?.code === 403) {
      redirectToLogin()
    }

    return Promise.reject(res)
  }

  return res
}

async function decodeBinaryJson (data, responseType) {
  let text

  if (responseType === 'blob') {
    text = await data.text()
  } else {
    text = new TextDecoder('utf-8').decode(data)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON response')
  }
}

// request interceptor
service.interceptors.request.use(
  config => {
    if (!config.headers) {
      config.headers = {}
    }
    const app = useAppStore()
    const lang = app.setting.lang
    if (lang) {
      config.headers['Accept-Language'] = lang
    }

    return config
  },
  error => {
    // do something with request error
    return Promise.reject(error)
  },
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
   */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  async response => {
    const responseType = response.config.responseType
    const isBinary =
      responseType === 'blob' ||
      responseType === 'arraybuffer'

    if (isBinary) {
      const contentType =
        response.headers?.['content-type']?.toLowerCase() || ''

      if (contentType.includes('application/json')) {
        const json = await decodeBinaryJson(response.data, responseType)
        return handleBusinessResponse(json)
      }

      return response.data
    }

    return handleBusinessResponse(response.data)
  },
  error => {
    if (error.code === 'ECONNABORTED'
      && error.message.indexOf('timeout') > -1) {
      error.message = 'Connection Time Out!'
    }
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000,
    })
    return Promise.reject(error)
  },
)

export default service

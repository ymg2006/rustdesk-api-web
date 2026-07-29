import { router } from '@/router'
import { useRouteStore } from '@/store/router'
import { useUserStore } from '@/store/user'
import { pinia } from '@/store'
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css'
import { useAppStore } from '@/store/app'; // progress bar style
import { T } from '@/utils/i18n'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/register']
const routeStore = useRouteStore(pinia)
const appStore = useAppStore(pinia)
appStore.getAdminConfig()
router.beforeEach(async (to, from, next) => {

  document.title = T(to.meta?.title) + ' - ' + appStore.setting.title
  NProgress.start()

  // No longer rely on a localStorage token; login state is verified by the backend via HttpOnly Cookie.
  // Public pages pass through directly; other pages call /user/current to check login state (cookie is sent automatically).
  if (whiteList.indexOf(to.path) !== -1) {
    next()
    return
  }

  const userStore = useUserStore(pinia)

  if (userStore.route_names.length) {
    next()
    return
  }

  const info = await userStore.info()
  if (!info) {
    userStore.logout()
    next(`/login?redirect=${to.path}`)
  } else {
    // Check whether the target route is registered to avoid falling through to 404 when dynamic routes are incomplete
    const resolved = router.resolve(to.path)
    if (resolved.name) {
      next({ ...to, replace: true })
    } else {
      next({ path: '/home', replace: true })
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

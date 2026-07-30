import { createRouter, createWebHashHistory } from 'vue-router'

const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    meta: { title: 'Login' },
    component: () => import('@/views/login/login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    meta: { title: 'Register' },
    component: () => import('@/views/register/index.vue'),
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404.vue'),
    hidden: true,
  },
  {
    path: '/oauth/:code',
    meta: { title: 'OauthLogin' },
    component: () => import('@/views/oauth/login.vue'),
    hidden: true,
  },
  {
    path: '/oauth/bind/:code',
    meta: { title: 'OauthBind' },
    component: () => import('@/views/oauth/bind.vue'),
    hidden: true,
  },
]
export const asyncRoutes = [
  // ========== Home ==========
  {
    path: '/',
    name: 'Home',
    redirect: '/home',
    meta: { title: 'Status', icon: 'DataBoard' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '/home',
        name: 'HomePage',
        meta: { title: 'Status', icon: 'DataBoard' },
        component: () => import('@/views/home/index.vue'),
      },
    ],
  },
  // ========== My ==========
  {
    path: '/my',
    name: 'My',
    redirect: '/my/info',
    meta: { title: 'My', icon: 'UserFilled' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '/',
        name: 'MyInfo',
        meta: { title: 'Userinfo', icon: 'User' },
        component: () => import('@/views/my/info.vue'),
      },
      {
        path: 'peer',
        name: 'MyPeer',
        meta: { title: 'MyPeer', icon: 'Monitor' },
        component: () => import('@/views/my/peer/index.vue'),
      },
      {
        path: 'address_book_collection',
        name: 'MyAddressBookCollection',
        meta: { title: 'AddressBookName', icon: 'Collection' },
        component: () => import('@/views/my/address_book/collection.vue'),
      },
      {
        path: 'address_book',
        name: 'MyAddressBookList',
        meta: { title: 'AddressBooks', icon: 'Notebook' },
        component: () => import('@/views/my/address_book/index.vue'),
      },
      {
        path: 'tag',
        name: 'MyTagList',
        meta: { title: 'Tags', icon: 'CollectionTag' },
        component: () => import('@/views/my/tag/index.vue'),
      },
      {
        path: 'shareRecord',
        name: 'MyShareRecordList',
        meta: { title: 'ShareRecord', icon: 'Share' },
        component: () => import('@/views/my/share_record/index.vue'),
      },
      {
        path: 'loginLog',
        name: 'MyLoginLog',
        meta: { title: 'LoginLog', icon: 'List' },
        component: () => import('@/views/my/login_log/index.vue'),
      },
      {
        path: 'subscription',
        name: 'MySubscription',
        meta: { title: 'MySubscription', icon: 'CollectionTag' },
        component: () => import('@/views/subscribe/MySubscription.vue'),
      },
    ],
  },
  // ========== Device Management ==========
  {
    path: '/device',
    name: 'Device',
    redirect: '/device/peer',
    meta: { title: 'DeviceManage', icon: 'Monitor' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'peer',
        name: 'Peer',
        meta: { title: 'PeerManage', icon: 'Monitor' },
        component: () => import('@/views/peer/index.vue'),
      },
      {
        path: 'deviceGroup',
        name: 'DeviceGroup',
        meta: { title: 'DeviceGroupManage', icon: 'ChatRound' },
        component: () => import('@/views/group/deviceGroupList.vue'),
      },
    ],
  },
  // ========== User Management ==========
  {
    path: '/user',
    name: 'UserMgmt',
    redirect: '/user/index',
    meta: { title: 'UserMgmt', icon: 'User' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'index',
        name: 'UserList',
        meta: { title: 'UserManage', icon: 'User' },
        component: () => import('@/views/user/index.vue'),
      },
      {
        path: 'add',
        name: 'UserAdd',
        meta: { title: 'UserAdd', hide: true },
        component: () => import('@/views/user/edit.vue'),
      },
      {
        path: 'edit/:id',
        name: 'UserEdit',
        meta: { title: 'UserEdit', hide: true },
        component: () => import('@/views/user/edit.vue'),
      },
      {
        path: 'group',
        name: 'UserGroup',
        meta: { title: 'GroupManage', icon: 'ChatRound' },
        component: () => import('@/views/group/index.vue'),
      },
      {
        path: '/userToken',
        name: 'UserToken',
        meta: { title: 'UserToken', icon: 'Ticket' },
        component: () => import('@/views/user/token.vue'),
      },
      {
        path: '/oauth',
        name: 'Oauth',
        meta: { title: 'OauthManage', icon: 'Link' },
        component: () => import('@/views/oauth/index.vue'),
      },
    ],
  },
  // ========== Address Book Management ==========
  {
    path: '/ab',
    name: 'AbMgmt',
    redirect: '/ab/collection',
    meta: { title: 'AbMgmt', icon: 'Notebook' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'collection',
        name: 'UserAddressBookName',
        meta: { title: 'AddressBookNameManage', icon: 'Collection' },
        component: () => import('@/views/address_book/collection.vue'),
      },
      {
        path: 'addressBook',
        name: 'UserAddressBook',
        meta: { title: 'AddressBookManage', icon: 'Notebook' },
        component: () => import('@/views/address_book/index.vue'),
      },
      {
        path: 'tag',
        name: 'UserTag',
        meta: { title: 'TagsManage', icon: 'CollectionTag' },
        component: () => import('@/views/tag/index.vue'),
      },
    ],
  },
  // ========== System Management ==========
  {
    path: '/system',
    name: 'SystemMgmt',
    redirect: '/system/strategy',
    meta: { title: 'SystemMgmt', icon: 'Setting' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'strategy',
        name: 'Strategy',
        meta: { title: 'Strategy', icon: 'Files' },
        component: () => import('@/views/strategy/index.vue'),
      },
      {
        path: '/serverCmd',
        name: 'ServerCmd',
        meta: { title: 'ServerCmd', icon: 'Tools' },
        component: () => import('@/views/rustdesk/control.vue'),
      },
      {
        path: '/versionRelease',
        name: 'VersionRelease',
        meta: { title: 'VersionRelease', icon: 'Upload' },
        component: () => import('@/views/rustdesk/version_release.vue'),
      },
      {
        path: '/alertConfig',
        name: 'AlertConfig',
        meta: { title: 'AlertConfig', icon: 'Bell' },
        component: () => import('@/views/rustdesk/alert_config.vue'),
      },
      {
        path: '/stationMessages',
        name: 'StationMessages',
        meta: { title: 'StationMessages', icon: 'Message' },
        component: () => import('@/views/rustdesk/station_messages.vue'),
      },
      {
        path: '/configFile',
        name: 'ConfigFile',
        meta: { title: 'ConfigFile', icon: 'Document' },
        component: () => import('@/views/rustdesk/config_file.vue'),
      },
      {
        path: '/serverStatus',
        name: 'ServerStatus',
        meta: { title: 'ServerStatus', icon: 'Monitor' },
        component: () => import('@/views/rustdesk/server_status.vue'),
      },
      {
        path: '/processMonitor',
        name: 'ProcessMonitor',
        meta: { title: 'ProcessMonitor', icon: 'Monitor' },
        component: () => import('@/views/rustdesk/process_monitor.vue'),
      },
      {
        path: '/inviteCodes',
        name: 'AdminInviteCode',
        meta: { title: 'AdminInviteCode', icon: 'Key' },
        component: () => import('@/views/admin/InviteCode.vue'),
      },
      // {
      //   path: '/adminOrders',
      //   name: 'AdminOrder',
      //   meta: { title: 'AdminOrder', icon: 'List' },
      //   component: () => import('@/views/admin/AdminOrder.vue'),
      // },
      {
        path: '/adminSubscriptions',
        name: 'AdminSubscription',
        meta: { title: 'AdminSubscription', icon: 'Timer' },
        component: () => import('@/views/admin/AdminSubscription.vue'),
      },
      {
        path: '/shareRecord',
        name: 'ShareRecord',
        meta: { title: 'ShareRecord', icon: 'Share' },
        component: () => import('@/views/share_record/index.vue'),
      },
    ],
  },
  // ========== Audit Logs ==========
  {
    path: '/audit',
    name: 'AuditMgmt',
    redirect: '/audit/conn',
    meta: { title: 'AuditMgmt', icon: 'Tickets' },
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: 'conn',
        name: 'AuditConn',
        meta: { title: 'AuditConnLog', icon: 'Tickets' },
        component: () => import('@/views/audit/connList.vue'),
      },
      {
        path: 'file',
        name: 'AuditFile',
        meta: { title: 'AuditFileLog', icon: 'Files' },
        component: () => import('@/views/audit/fileList.vue'),
      },
      {
        path: '/loginLog',
        name: 'LoginLog',
        meta: { title: 'LoginLog', icon: 'List' },
        component: () => import('@/views/login/log.vue'),
      },
    ],
  },
]
export const lastRoutes = [
  { path: '/:catchAll(.*)', redirect: '/404', meta: { hide: true } },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
})

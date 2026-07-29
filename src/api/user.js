import request from '@/utils/request'

export function login (data) {
  return request({
    url: '/login',
    method: 'post',
    data,
  })
}

export function current () {
  return request({
    url: '/user/current',
    method: 'get',
  })
}

export function list (params) {
  return request({
    url: '/user/list',
    params,
  })
}

export function detail (id) {
  return request({
    url: `/user/detail/${id}`,
  })
}

export function create (data) {
  return request({
    url: '/user/create',
    method: 'post',
    data,
  })
}

export function update (data) {
  return request({
    url: '/user/update',
    method: 'post',
    data,
  })
}

export function remove (data) {
  return request({
    url: '/user/delete',
    method: 'post',
    data,
  })
}

export function changePwd (data) {
  return request({
    url: '/user/changePwd',
    method: 'post',
    data,
  })
}

export function changeCurPwd (data) {
  return request({
    url: '/user/changeCurPwd',
    method: 'post',
    data,
  })
}

export function myOauth () {
  return request({
    url: '/user/myOauth',
    method: 'post',
  })
}

export function mfaSetup () {
  return request({
    url: '/user/mfa/setup',
    method: 'post',
  })
}

export function mfaEnable (data) {
  return request({
    url: '/user/mfa/enable',
    method: 'post',
    data,
  })
}

export function mfaDisable (data) {
  return request({
    url: '/user/mfa/disable',
    method: 'post',
    data,
  })
}

export function mfaStatus () {
  return request({
    url: '/user/mfa/status',
    method: 'get',
  })
}

// Admin-forced MFA reset for a specific user (recovery when authenticator/recovery codes are lost)
export function mfaReset (data) {
  return request({
    url: '/user/mfa/reset',
    method: 'post',
    data,
  })
}

export function groupUsers (data) {
  return request({
    url: '/user/groupUsers',
    method: 'post',
    data,
  })
}

export function register (data) {
  return request({
    url: '/user/register',
    method: 'post',
    data,
  })
}

// Invite code management (new InviteCode API)
export function invitationList (params) {
  return request({
    url: '/invite-codes',
    params,
  })
}

export function invitationCreate (data) {
  return request({
    url: '/invite-codes',
    method: 'post',
    data,
  })
}

export function invitationRevoke (id) {
  return request({
    url: `/invite-codes/${id}/revoke`,
    method: 'post',
  })
}

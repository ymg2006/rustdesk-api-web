import request from '@/utils/request'

/**
 * Get pricing for available durations
 */
export function getPlans () {
  return request({
    url: '/subscribe/plans',
    method: 'get',
  })
}

/**
 * Create a subscription order
 * @param {string} channel - Payment channel: wechat | alipay
 * @param {string} planKey - Duration key: 1m / 3m / 6m / 12m
 */
export function createOrder (channel, planKey) {
  return request({
    url: '/subscribe/create-order',
    method: 'post',
    data: { channel, plan_key: planKey },
  })
}

/**
 * Query order status
 * @param {string} outTradeNo - Merchant order number
 */
export function queryOrder (outTradeNo) {
  return request({
    url: `/subscribe/order/${outTradeNo}`,
    method: 'get',
  })
}

/**
 * Claim an invite code by order number (fallback)
 * @param {string} outTradeNo - Merchant order number
 */
export function claimCode (outTradeNo) {
  return request({
    url: '/subscribe/claim',
    method: 'post',
    data: { out_trade_no: outTradeNo },
  })
}

/**
 * Redeem an invite code
 * @param {string} code - Invite code
 */
export function redeemCode (code) {
  return request({
    url: '/subscribe/redeem',
    method: 'post',
    data: { code },
  })
}

/**
 * Get subscription information for the current user
 */
export function getMine () {
  return request({
    url: '/subscribe/mine',
    method: 'get',
  })
}

// ========== Admin Management ==========

/**
 * Paginated invite-code list query
 * @param {Object} params - { status, plan, page, size }
 */
export function adminListCodes (params) {
  return request({
    url: '/invite-codes',
    method: 'get',
    params,
  })
}

/**
 * Manually generate an invite code
 * @param {Object} req - { plan, expire_days, remark }
 */
export function adminCreateCode (req) {
  return request({
    url: '/invite-codes',
    method: 'post',
    data: req,
  })
}

/**
 * Revoke an invite code
 * @param {number} id - Invite code ID
 */
export function adminRevokeCode (id) {
  return request({
    url: `/invite-codes/${id}/revoke`,
    method: 'post',
  })
}

/**
 * Delete an invite code
 * @param {number} id - Invite code ID
 */
export function adminDeleteCode (id) {
  return request({
    url: `/invite-codes/${id}`,
    method: 'delete',
  })
}

/**
 * Export invite-code CSV
 * @param {Object} params - { status, plan }
 */
export function adminExportCodes (params) {
  return request({
    url: '/invite-codes/export',
    method: 'get',
    params,
    responseType: 'blob',
  })
}

// ========== Admin Order Management ==========

/**
 * Paginated order list query
 * @param {Object} params - { status, keyword, page, size }
 */
export function adminListOrders (params) {
  return request({
    url: '/orders/list',
    method: 'get',
    params,
  })
}

/**
 * Manually confirm payment receipt
 * @param {number} id - Order ID
 */
export function adminConfirmOrder (id) {
  return request({
    url: `/orders/${id}/confirm`,
    method: 'post',
  })
}

/**
 * Close an order
 * @param {number} id - Order ID
 */
export function adminCloseOrder (id) {
  return request({
    url: `/orders/${id}/close`,
    method: 'post',
  })
}

// ========== Admin Subscription Management ==========

/**
 * Paginated subscription/member list query
 * @param {Object} params - { status, keyword, page, size }
 */
export function adminListSubscriptions (params) {
  return request({
    url: '/subscriptions/list',
    method: 'get',
    params,
  })
}

/**
 * Extend a subscription/member period
 * @param {Object} data - { user_id, plan, plan_key }
 */
export function adminExtendSubscription (data) {
  return request({
    url: '/subscriptions/extend',
    method: 'post',
    data,
  })
}

import request from '@/utils/request'

// Process/port monitoring: admin-side rule management + status view
export function processRules () {
  return request({ url: '/process_monitor/rules', method: 'get' })
}
export function createProcessRule (data) {
  return request({ url: '/process_monitor/rule/create', method: 'post', data })
}
// Batch-create rules by device group, address-book tag, or device list
export function batchCreateProcessRule (data) {
  return request({ url: '/process_monitor/rule/batch_create', method: 'post', data })
}
// Optional device sources: device groups and address-book tags
export function processPeerSources () {
  return request({ url: '/process_monitor/peer_sources', method: 'get' })
}
export function updateProcessRule (data) {
  return request({ url: '/process_monitor/rule/update', method: 'post', data })
}
export function deleteProcessRule (data) {
  return request({ url: '/process_monitor/rule/delete', method: 'post', data })
}
export function processStatus (params) {
  return request({ url: '/process_monitor/status', method: 'get', params })
}
// Reuse the alert rule list for the rule-form dropdown
export function alertConfigList () {
  return request({ url: '/alert_config/list', method: 'get' })
}

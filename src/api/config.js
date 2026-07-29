import request from '@/utils/request'

export function server () {
  return request({
    url: '/config/server',
    method: 'get',
  })
}

export function app () {
  return request({
    url: '/config/app',
    method: 'get',
  })
}

export function admin () {
  return request({
    url: '/config/admin',
    method: 'get',
  })
}

// Read the raw backend config file content (config.yaml)
export function fileGet () {
  return request({
    url: '/config/file/get',
    method: 'get',
  })
}

// Save the raw backend config file content (config.yaml)
export function fileUpdate (content) {
  return request({
    url: '/config/file/update',
    method: 'post',
    data: { content },
  })
}

// Restart the backend service process to apply configuration changes; admin only
export function serviceRestart () {
  return request({
    url: '/config/restart',
    method: 'post',
  })
}

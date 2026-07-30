import request from '@/utils/request'

// Get server status (probe all custom servers for the current user + hbbr load)
export function serverStatus () {
  return request({
    url: '/server_status',
    method: 'get',
  })
}

// List server entries for the current user
export function serverStatusList () {
  return request({
    url: '/server_status/list',
    method: 'get',
  })
}

// Create a server entry
export function serverStatusCreate (data) {
  return request({
    url: '/server_status/create',
    method: 'post',
    data,
  })
}

// Update a server entry
export function serverStatusUpdate (data) {
  return request({
    url: '/server_status/update',
    method: 'post',
    data,
  })
}

// Delete a server entry
export function serverStatusDelete (id) {
  return request({
    url: '/server_status/delete',
    method: 'post',
    data: { id },
  })
}

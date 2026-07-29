<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>{{ T('StationMessages') }} ({{ total }})</span>
          <div>
            <el-switch
              v-if="isAdmin"
              v-model="scopeOwn"
              :active-text="T('OnlyMyMessages')"
              :inactive-text="T('ShowAll')"
              @change="getList"
              style="margin-right: 10px;"
            />
            <el-button size="small" type="primary" @click="showSendDialog">{{ T('SendMessage') }}</el-button>
            <el-button v-if="isAdmin" size="small" type="danger" @click="showBroadcastDialog" class="me-8px">{{ T('Broadcast') }}</el-button>
            <el-dropdown size="small" v-if="isAdmin" trigger="click" @command="cleanup" class="d-contents">
              <el-button size="small" type="warning">{{ T('CleanOldMessages') }}</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="1">{{ T('CleanMessagesOlderThan1Year') }}</el-dropdown-item>
                  <el-dropdown-item command="3">{{ T('CleanMessagesOlderThan3Years') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small" @click="markAllRead" class="ms-8px">{{ T('MarkAllRead') }}</el-button>
          </div>
        </div>
      </template>
      <el-table :data="messages" v-loading="loading" border>
        <el-table-column prop="sender_name" :label="T('Sender')" min-width="120">
          <template #default="{row}">
            <span v-if="row.sender_name">{{ row.sender_name }}</span>
            <span v-else class="hint-text">{{ T('System') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" :label="T('Title')" min-width="140">
          <template #default="{row}">
            <span :style="row.is_read === 0 ? 'font-weight: bold' : ''">{{ row.title || '-' }}</span>
            <el-tag v-if="row.type === 'broadcast'" type="danger" size="small" style="margin-left: 4px;">{{ T('Broadcast') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" :label="T('Content')" min-width="240">
          <template #default="{row}">
            <el-text truncated>{{ row.content }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="T('Time')" min-width="170">
          <template #default="{row}">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="T('Status')" min-width="80" align="center">
          <template #default="{row}">
            <el-tag v-if="row.is_read === 0" type="danger" size="small">{{ T('Unread') }}</el-tag>
            <el-tag v-else size="small">{{ T('Read') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="T('Actions')" align="center" width="100" fixed="right">
          <template #default="{row}">
            <el-button v-if="row.is_read === 0" @click="markRead(row)" size="small">{{ T('MarkRead') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Send message dialog -->
    <el-dialog v-model="sendVisible" :title="isBroadcast ? T('Broadcast') : T('SendMessage')" width="500px">
      <el-form label-width="80px">
        <el-form-item v-if="!isBroadcast" :label="T('Receiver')">
          <el-select v-model="sendForm.receiver_id" filterable remote :remote-method="searchUsers" :loading="userLoading" style="width: 100%" :placeholder="T('SearchUsername')">
            <el-option v-for="u in userList" :key="u.id" :label="u.username" :value="u.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="isBroadcast" :label="T('Target')">
          <el-tag type="danger">{{ T('AllUsers') }}</el-tag>
        </el-form-item>
        <el-form-item :label="T('Title')">
          <el-input v-model="sendForm.title" :placeholder="T('MessageTitleOptional')"></el-input>
        </el-form-item>
        <el-form-item :label="T('Content')">
          <el-input v-model="sendForm.content" type="textarea" :rows="4" :placeholder="T('PleaseEnterMessageContent')"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="doSend">{{ T('Submit') }}</el-button>
          <el-button @click="sendVisible = false">{{ T('Cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { T } from '@/utils/i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { list as getMessages, markRead as markMsgRead, send, broadcast, cleanup as apiCleanup } from '@/api/message'
import request from '@/utils/request'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const messages = ref([])
const total = ref(0)
const loading = ref(false)
const isAdmin = ref(false)
const sendVisible = ref(false)
const isBroadcast = ref(false)
const userList = ref([])
const userLoading = ref(false)
const scopeOwn = ref(false)

const sendForm = ref({ receiver_id: null, title: '', content: '' })

const getList = async () => {
  loading.value = true
  const params = scopeOwn.value ? { scope: 'own' } : {}
  const res = await getMessages(params).catch(_ => false)
  loading.value = false
  if (res) {
    messages.value = res.data.list
    total.value = res.data.total
  }
}

const markAllRead = async () => {
  const res = await markMsgRead({ all: true }).catch(_ => false)
  if (res) {
    ElMessage.success(T('OperationSuccess'))
    getList()
  }
}

const markRead = async (row) => {
  const res = await markMsgRead({ id: row.row_id }).catch(_ => false)
  if (res) {
    row.is_read = 1
  }
}

const cleanup = async (years) => {
  const cf = await ElMessageBox.confirm(`Delete messages older than ${years} year(s)? This cannot be undone.`, { type: 'warning', confirmButtonText: 'Confirm Delete', cancelButtonText: 'Cancel' }).catch(_ => false)
  if (!cf) return
  const res = await apiCleanup({ years }).catch(_ => false)
  if (res) {
    ElMessage.success(`Cleaned ${res.data.deleted} messages`)
    getList()
  }
}

const searchUsers = async (query) => {
  if (!query) return
  userLoading.value = true
  // groupUsers does not require admin permissions and returns all users
  const res = await request({ url: '/user/groupUsers', method: 'post' }).catch(_ => false)
  userLoading.value = false
  if (res && res.data && res.data.users) {
    // groupUsers returns users as an array, but UserList uses `json:"list,omitempty"`
    // Support both formats: direct array or { list: [...] }
    let users = []
    if (Array.isArray(res.data.users)) {
      users = res.data.users
    } else if (res.data.users.list) {
      users = res.data.users.list
    }
    userList.value = users.filter(u =>
      u.username && u.username.toLowerCase().includes(query.toLowerCase())
    )
  }
}

const showSendDialog = () => {
  isBroadcast.value = false
  sendForm.value = { receiver_id: null, title: '', content: '' }
  userList.value = []
  sendVisible.value = true
}

const showBroadcastDialog = () => {
  isBroadcast.value = true
  sendForm.value = { receiver_id: null, title: '', content: '' }
  sendVisible.value = true
}

const doSend = async () => {
  if (!sendForm.value.title && !sendForm.value.content) {
    ElMessage.warning('Please enter message content')
    return
  }
  let res
  if (isBroadcast.value) {
    res = await broadcast({ title: sendForm.value.title, content: sendForm.value.content }).catch(_ => false)
  } else {
    if (!sendForm.value.receiver_id) {
      ElMessage.warning('Please select a receiver')
      return
    }
    res = await send({
      receiver_id: sendForm.value.receiver_id,
      title: sendForm.value.title,
      content: sendForm.value.content,
    }).catch(_ => false)
  }
  if (res) {
    ElMessage.success(T('OperationSuccess'))
    sendVisible.value = false
    getList()
  }
}

const formatTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(async () => {
  const info = await userStore.info().catch(_ => false)
  // Check if user has admin role by checking route_names
  isAdmin.value = userStore.route_names && userStore.route_names.includes('*')
  getList()
})
</script>

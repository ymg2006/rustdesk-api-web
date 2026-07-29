<template>
  <div>

    <el-card class="list-query" shadow="hover">
      <div class="action-bar">
        <span style="font-size: 16px; font-weight: 500;">Strategy Management</span>
        <el-button type="text" size="small" style="margin-left: 4px; font-size: 16px; color: var(--apple-blue);" @click="showHelp = true">?</el-button>
        <el-button type="primary" size="small" style="float: right;" @click="showEdit(null)">New Strategy</el-button>
      </div>
      <el-form inline label-width="80px">
        <el-form-item label="Strategy Name">
          <el-input v-model="query.name" placeholder="Search strategy name" clearable style="width: 200px"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList">Search</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-body" shadow="hover" style="margin-top: 16px;">
      <el-table :data="listRes.list" v-loading="listRes.loading" border>
        <el-table-column prop="id" :label="T('ID')" min-width="60" align="center"></el-table-column>
        <el-table-column prop="name" label="Strategy Name" min-width="160" align="center">
          <template #default="{row}">
            <strong>{{ row.name }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="Status" min-width="80" align="center">
          <template #default="{row}">
            <el-tag v-if="row.status === 1" type="success" size="small">Enabled</el-tag>
            <el-tag v-else type="danger" size="small">Disabled</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="Priority" min-width="80" align="center"></el-table-column>
        <el-table-column label="Binding Scope" min-width="160" align="center">
          <template #default="{row}">
            <el-tag v-if="row.bind_type === 'user'" type="primary" size="small">User</el-tag>
            <el-tag v-else-if="row.bind_type === 'group'" type="success" size="small">Device Group</el-tag>
            <el-tag v-else-if="row.bind_type === 'tag'" type="warning" size="small">Tag</el-tag>
            <el-tag v-else type="info" size="small">Global</el-tag>
            <span style="margin-left: 4px; font-size: 12px;">{{ getBindName(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" min-width="200" align="center" fixed="right">
          <template #default="{row}">
            <el-button type="primary" size="small" @click="showEdit(row)">Edit</el-button>
            <el-button type="danger" size="small" @click="del(row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="listRes.total > 0"
        background
        layout="prev, pager, next"
        :total="listRes.total"
        :page-size="listQuery.page_size"
        v-model:current-page="listQuery.page"
        @current-change="getList"
      />
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? 'Edit Strategy' : 'New Strategy'" width="700px" @close="resetForm">
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="Strategy Name" required>
          <el-input v-model="form.name" placeholder="Example: Office Network Policy" style="width: 400px"></el-input>
        </el-form-item>
        <el-form-item label="Priority">
          <el-input-number v-model="form.priority" :min="0" :max="999" />
          <span class="hint-text" style="font-size:12px;margin-left:8px;">Higher numbers have higher priority</span>
        </el-form-item>
        <el-form-item label="Binding Scope" required>
          <el-radio-group v-model="form.bind_type">
            <el-radio label="user">User</el-radio>
            <el-radio label="group">Device Group</el-radio>
            <el-radio label="tag">Tag</el-radio>
            <el-radio label="global">Global</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.bind_type === 'user'" label="Select User">
          <el-select v-model="form.bind_id" placeholder="Select user" style="width: 300px" filterable>
            <el-option v-for="u in userListData" :key="u.id" :label="u.username + ' (' + (u.nickname || '') + ')'" :value="u.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.bind_type === 'group'" label="Select Group">
          <el-select v-model="form.bind_id" placeholder="Select device group" style="width: 300px" filterable>
            <el-option v-for="g in groupListData" :key="g.id" :label="g.name" :value="g.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.bind_type === 'tag'" label="Select Tag">
          <el-select v-model="form.bind_id" placeholder="Select tag" style="width: 300px" filterable>
            <el-option v-for="t in tagListData" :key="t.id" :label="t.name" :value="t.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="2" />
        </el-form-item>
        <el-form-item label="Config Items">
          <el-input v-model="form.config_items" type="textarea" :rows="10"
            placeholder="One config item per line, format: key=value&#10;Example:&#10;force_relay=Y&#10;enable-udp-punch=N&#10;enable-clipboard=N&#10;custom-rendezvous-server=192.0.2.1:21116"
            style="width: 100%">
          </el-input>
          <div class="hint-text" style="font-size:12px;margin-top:4px;">
            Common config items: force_relay, enable-udp-punch, enable-ipv6-punch, enable-clipboard, enable-audio, enable-file-transfer, custom-rendezvous-server
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">Save</el-button>
      </template>
    </el-dialog>

    <!-- Help Dialog -->
    <el-dialog v-model="showHelp" title="Strategy Config Template" width="650px">
      <div style="font-size: 14px; line-height: 1.8; font-family: 'Consolas', 'Courier New', monospace; background: #f8f9fa; padding: 16px; border-radius: 6px;">
        <div style="color: #999; margin-bottom: 4px;"># ====== NAT Traversal ======</div>
        <div style="color: #999;"># Force relay: Y=force relay and disable P2P punching, N=allow P2P</div>
        <div style="margin-bottom: 4px;">force_relay=N</div>
        <div style="color: #999;"># Enable UDP punching; N disables UDP punching and uses TCP relay only</div>
        <div style="margin-bottom: 4px;">enable-udp-punch=Y</div>
        <div style="color: #999;"># Enable IPv6 punching; N disables IPv6 traversal</div>
        <div style="margin-bottom: 4px;">enable-ipv6-punch=Y</div>
        <div style="color: #999;"># Enable UPnP automatic port mapping; N disables it</div>
        <div style="margin-bottom: 4px;">enable-upnp=Y</div>
        <div style="color: #999;"># Custom relay server address (use when running your own relay)</div>
        <div style="color: #999;"># Format: domain or IP:port</div>
        <div style="margin-bottom: 8px;">#custom-rendezvous-server=relay.example.com:21116</div>
        <div style="color: #999; margin-bottom: 4px;"># ====== Feature Switches ======</div>
        <div style="color: #999;"># Enable clipboard sharing; N disables remote copy/paste</div>
        <div style="margin-bottom: 4px;">enable-clipboard=Y</div>
        <div style="color: #999;"># Enable audio transmission; N disables remote audio</div>
        <div style="margin-bottom: 4px;">enable-audio=Y</div>
        <div style="color: #999;"># Enable file transfer; N disables remote file transfer</div>
        <div style="margin-bottom: 4px;">enable-file-transfer=Y</div>
        <div style="color: #999;"># Encryption mode options: default / no_encryption / encrypted</div>
        <div style="margin-bottom: 8px;">#encryption-mode=default</div>
        <div style="color: #999; margin-bottom: 4px;"># ====== Display and Performance ======</div>
        <div style="color: #999;"># Remote image quality options: quality / balanced / speed</div>
        <div style="margin-bottom: 4px;">#image-quality=balanced</div>
        <div style="color: #999;"># Maximum FPS limit; 0 means unlimited</div>
        <div style="margin-bottom: 8px;">#max-fps=30</div>
        <div style="color: #999; margin-bottom: 4px;"># ====== Security Policy ======</div>
        <div style="color: #999;"># Hide usernames in address book; Y shows only device names</div>
        <div style="margin-bottom: 4px;">#hide-username-on-card=N</div>
        <div style="color: #999;"># Enable direct-connection verification; Y requires handshake verification</div>
        <div style="margin-bottom: 4px;">#enable-directx-access=Y</div>
      </div>
      <div style="font-size: 12px; color: #999; margin-top: 12px; text-align: center;">
        Tip: Lines starting with # are comments and do not take effect. Remove # to enable the corresponding config item.
      </div>
      <template #footer>
        <el-button type="primary" @click="showHelp = false">Got it</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { list, create, update, remove } from '@/api/strategy'
import { list as userList } from '@/api/user'
import { list as groupList } from '@/api/device_group'
import { list as tagList } from '@/api/tag'
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { T } from '@/utils/i18n'

const bindNameMap = reactive({})
const getBindName = (row) => bindNameMap[row.id] || ''
const userListData = ref([])
const groupListData = ref([])
const tagListData = ref([])

const query = reactive({
  name: '',
})

const form = reactive({
  name: '',
  status: 1,
  priority: 0,
  bind_type: 'global',
  bind_id: 0,
  config_items: '',
})

const showHelp = ref(false)
const editingId = ref(0)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const submitForm = async () => {
  if (!form.name) {
    ElMessage.error('Strategy name cannot be empty')
    return
  }
  submitting.value = true
  const data = { ...form }
  if (editingId.value > 0) {
    data.id = editingId.value
  }
  const api = editingId.value > 0 ? update : create
  const res = await api(data).catch(e => {
    ElMessage.error((e && e.message) || 'Operation failed')
    return false
  })
  submitting.value = false
  if (res) {
    ElMessage.success('Operation successful')
    dialogVisible.value = false
    getList()
  }
}

const showEdit = (row) => {
  if (row) {
    editingId.value = row.id
    form.name = row.name
    form.status = row.status
    form.priority = row.priority
    form.bind_type = row.bind_type || 'global'
    form.bind_id = row.bind_id || 0
    form.config_items = row.config_items
  } else {
    editingId.value = 0
    form.name = ''
    form.status = 1
    form.priority = 0
    form.bind_type = 'global'
    form.bind_id = 0
    form.config_items = ''
  }
  dialogVisible.value = true
}

const resetForm = () => {
  form.name = ''
  form.status = 1
  form.priority = 0
  form.bind_type = 'global'
  form.bind_id = 0
  form.config_items = ''
  editingId.value = 0
}

const listRes = reactive({
  list: [], total: 0, loading: false,
})
const listQuery = reactive({
  page: 1,
  page_size: 10,
})
const getList = async () => {
  listRes.loading = true
  const res = await list(listQuery).catch(_ => false)
  listRes.loading = false
  if (res) {
    listRes.list = res.data.list
    listRes.total = res.data.total
    // Populate binding name mapping for table display
    for (const row of res.data.list) {
      let name = ''
      if (row.bind_type === 'user') {
        const u = userListData.value.find(u => u.id === row.bind_id)
        name = u ? u.username : ''
      } else if (row.bind_type === 'group') {
        const g = groupListData.value.find(g => g.id === row.bind_id)
        name = g ? g.name : ''
      } else if (row.bind_type === 'tag') {
        const t = tagListData.value.find(t => t.id === row.bind_id)
        name = t ? t.name : ''
      }
      bindNameMap[row.id] = name
    }
  }
}
onMounted(async () => {
  getList()
  // Preload users, groups, and tags
  const [uRes, gRes, tRes] = await Promise.all([
    userList({ page_size: 9999 }).catch(() => ({ data: { list: [] } })),
    groupList({ page_size: 9999 }).catch(() => ({ data: { list: [] } })),
    tagList({ page_size: 9999 }).catch(() => ({ data: { list: [] } })),
  ])
  userListData.value = uRes.data.list || []
  groupListData.value = gRes.data.list || []
  tagListData.value = tRes.data.list || []
})

const del = async (row) => {
  const cf = await ElMessageBox.confirm(`Delete strategy "${row.name}"?`, 'Prompt', {
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    type: 'warning',
  }).catch(_ => false)
  if (!cf) return false
  const res = await remove({ id: row.id }).catch(_ => false)
  if (res) {
    // Clear cached name
    delete bindNameMap[row.id]
    ElMessage.success('Deleted successfully')
    getList()
  }
}
</script>

<style scoped lang="scss">
.action-bar {
  margin-bottom: 12px;
}
</style>

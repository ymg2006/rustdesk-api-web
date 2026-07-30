<template>
  <div>

    <el-card class="list-query"
             shadow="hover">
      <div class="action-bar">
        <span style="font-size: 16px; font-weight: 500;">{{ T('StrategyManagement') }}</span>
        <el-button type="text"
                   size="small"
                   style="margin-left: 4px; font-size: 16px; color: var(--apple-blue);"
                   @click="showHelp = true">?</el-button>
      </div>
      <el-form inline>
        <el-form-item :label="T('StrategyName')">
          <el-input v-model="query.name"
                    :placeholder="T('SearchStrategyName')"
                    clearable
                    style="width: 200px"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary"
                     @click="getList">{{ T('Filter') }}</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="danger"
                     @click="showEdit(null)">{{ T('Add') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-body"
             shadow="hover"
             style="margin-top: 16px;">
      <el-table :data="listRes.list"
                v-loading="listRes.loading"
                border>
        <el-table-column prop="id"
                         :label="T('ID')"
                         min-width="60"
                         align="center"></el-table-column>
        <el-table-column prop="name"
                         :label="T('StrategyName')"
                         min-width="160"
                         align="center">
          <template #default="{ row }">
            <strong>{{ row.name }}</strong>
          </template>
        </el-table-column>
        <el-table-column :label="T('Status')"
                         min-width="80"
                         align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1"
                    type="success"
                    size="small">{{ T('Enabled') }}</el-tag>
            <el-tag v-else
                    type="danger"
                    size="small">{{ T('Disabled') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority"
                         :label="T('Priority')"
                         min-width="80"
                         align="center"></el-table-column>
        <el-table-column :label="T('BindingScope')"
                         min-width="160"
                         align="center">
          <template #default="{ row }">
            <el-tag v-if="row.bind_type === 'user'"
                    type="primary"
                    size="small">{{ T('User') }}</el-tag>
            <el-tag v-else-if="row.bind_type === 'group'"
                    type="success"
                    size="small">{{ T('DeviceGroup') }}</el-tag>
            <el-tag v-else-if="row.bind_type === 'tag'"
                    type="warning"
                    size="small">{{ T('Tag') }}</el-tag>
            <el-tag v-else
                    type="info"
                    size="small">{{ T('Global') }}</el-tag>
            <span style="margin-left: 4px; font-size: 12px;">{{ getBindName(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('Actions')"
                         min-width="200"
                         align="center"
                         fixed="right">
          <template #default="{ row }">
            <el-button type="primary"
                       size="small"
                       @click="showEdit(row)">{{ T('Edit') }}</el-button>
            <el-button type="danger"
                       size="small"
                       @click="del(row)">{{ T('Delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination background
                     layout="prev, pager, next"
                     :total="listRes.total"
                     :page-size="listQuery.page_size"
                     v-model:current-page="listQuery.page"
                     @current-change="getList" />
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog v-model="dialogVisible"
               :title="editingId ? T('EditStrategy') : T('NewStrategy')"
               width="700px"
               @close="resetForm"
               append-to-body>
      <el-form ref="formRef"
               :model="form">
        <el-form-item :label="T('StrategyName')"
                      required>
          <el-input v-model="form.name"
                    :placeholder="T('StrategyNameExample')"
                    style="width: 400px"></el-input>
        </el-form-item>
        <el-form-item :label="T('Priority')">
          <el-input-number v-model="form.priority"
                           :min="0"
                           :max="999" />
          <span class="hint-text"
                style="font-size:12px;margin-left:8px;">{{ T('HigherNumberHigherPriority') }}</span>
        </el-form-item>
        <el-form-item :label="T('BindingScope')"
                      required>
          <el-radio-group v-model="form.bind_type">
            <el-radio label="user">{{ T('User') }}</el-radio>
            <el-radio label="group">{{ T('DeviceGroup') }}</el-radio>
            <el-radio label="tag">{{ T('Tag') }}</el-radio>
            <el-radio label="global">{{ T('Global') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.bind_type === 'user'"
                      :label="T('SelectUser')">
          <el-select v-model="form.bind_id"
                     :placeholder="T('SelectUser')"
                     style="width: 300px"
                     filterable>
            <el-option v-for="u in userListData"
                       :key="u.id"
                       :label="u.username + ' (' + (u.nickname || '') + ')'"
                       :value="u.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.bind_type === 'group'"
                      :label="T('SelectGroup')">
          <el-select v-model="form.bind_id"
                     :placeholder="T('SelectDeviceGroup')"
                     style="width: 300px"
                     filterable>
            <el-option v-for="g in groupListData"
                       :key="g.id"
                       :label="g.name"
                       :value="g.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.bind_type === 'tag'"
                      :label="T('SelectTag')">
          <el-select v-model="form.bind_id"
                     :placeholder="T('SelectTag')"
                     style="width: 300px"
                     filterable>
            <el-option v-for="t in tagListData"
                       :key="t.id"
                       :label="t.name"
                       :value="t.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('Status')">
          <el-switch v-model="form.status"
                     :active-value="1"
                     :inactive-value="2" />
        </el-form-item>
        <el-form-item :label="T('ConfigItems')">
          <el-input v-model="form.config_items"
                    type="textarea"
                    :rows="10"
                    :placeholder="T('ConfigItemsPlaceholder')"
                    style="width: 100%">
          </el-input>
          <div class="hint-text"
               style="font-size:12px;margin-top:4px;">
            {{ T('CommonConfigItems') }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ T('Cancel') }}</el-button>
        <el-button type="primary"
                   :loading="submitting"
                   @click="submitForm">{{ T('Save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Help Dialog -->
    <el-dialog v-model="showHelp"
               :title="T('StrategyConfigTemplate')"
               width="650px"
               append-to-body>
      <div
           style="font-size: 14px; line-height: 1.8; font-family: 'Consolas', 'Courier New', monospace; background: var(--el-bg-color-page); padding: 16px; border-radius: 6px;">
        <div style="color: var(--el-text-color-secondary); margin-bottom: 4px;"># ====== {{ T('NatTraversal') }} ======</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('ForceRelayHelp') }}</div>
        <div style="margin-bottom: 4px;">force_relay=N</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('UdpPunchHelp') }}</div>
        <div style="margin-bottom: 4px;">enable-udp-punch=Y</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('Ipv6PunchHelp') }}</div>
        <div style="margin-bottom: 4px;">enable-ipv6-punch=Y</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('UpnpHelp') }}</div>
        <div style="margin-bottom: 4px;">enable-upnp=Y</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('CustomRelayHelp') }}</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('DomainIpPortFormat') }}</div>
        <div style="margin-bottom: 8px;">#custom-rendezvous-server=relay.example.com:21116</div>
        <div style="color: var(--el-text-color-secondary); margin-bottom: 4px;"># ====== {{ T('FeatureSwitches') }} ======</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('ClipboardSharingHelp') }}</div>
        <div style="margin-bottom: 4px;">enable-clipboard=Y</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('AudioTransmissionHelp') }}</div>
        <div style="margin-bottom: 4px;">enable-audio=Y</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('FileTransferHelp') }}</div>
        <div style="margin-bottom: 4px;">enable-file-transfer=Y</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('EncryptionModeHelp') }}</div>
        <div style="margin-bottom: 8px;">#encryption-mode=default</div>
        <div style="color: var(--el-text-color-secondary); margin-bottom: 4px;"># ====== {{ T('DisplayAndPerformance') }} ======</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('ImageQualityHelp') }}</div>
        <div style="margin-bottom: 4px;">#image-quality=balanced</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('MaxFpsHelp') }}</div>
        <div style="margin-bottom: 8px;">#max-fps=30</div>
        <div style="color: var(--el-text-color-secondary); margin-bottom: 4px;"># ====== {{ T('SecurityPolicy') }} ======</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('HideUsernameHelp') }}</div>
        <div style="margin-bottom: 4px;">#hide-username-on-card=N</div>
        <div style="color: var(--el-text-color-secondary);"># {{ T('DirectConnectionVerificationHelp') }}</div>
        <div style="margin-bottom: 4px;">#enable-directx-access=Y</div>
      </div>
      <div style="font-size: 12px; color: var(--el-text-color-secondary); margin-top: 12px; text-align: center;">
        {{ T('StrategyConfigCommentTip') }}
      </div>
      <template #footer>
        <el-button type="primary"
                   @click="showHelp = false">{{ T('GotIt') }}</el-button>
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

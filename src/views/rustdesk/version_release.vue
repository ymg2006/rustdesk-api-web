<template>
  <div>

    <el-card class="list-query" shadow="hover">
      <div class="action-bar">
        <span style="font-size: 16px; font-weight: 500;">{{ T('PublishNewVersion') }}</span>
      </div>
      <el-form inline>
        <el-form-item :label="T('Version')">
          <el-input v-model="form.version" placeholder="1.4.8.2" style="width: 140px"></el-input>
        </el-form-item>
        <el-form-item :label="T('Platform')">
          <el-select v-model="form.platform" style="width: 130px">
            <el-option label="Windows" value="windows"></el-option>
            <el-option label="macOS" value="macos"></el-option>
            <el-option label="Ubuntu" value="ubuntu"></el-option>
            <el-option label="Android" value="android"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('Status')">
          <el-select v-model="form.status" style="width: 100px">
            <el-option :label="T('Enable')" :value="1"></el-option>
            <el-option :label="T('Disable')" :value="2"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('ForceUpdate')">
          <el-switch v-model="form.force_update" :active-value="1" :inactive-value="0" />
          <span class="hint-text" style="font-size:12px;margin-left:8px;">{{ T('ForceUpdateTip') }}</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submitForm">{{ T('Publish') }}</el-button>
        </el-form-item>
      </el-form>
      <el-form inline class="w-100">
        <el-form-item :label="T('DownloadUrl')">
          <el-input v-model="form.url" placeholder="https://github.com/.../rustdesk-1.4.9-x86_64.exe"></el-input>
        </el-form-item>
      </el-form>
      <el-form>
        <el-form-item :label="T('ReleaseNotes')">
          <el-input v-model="form.note" type="textarea" :rows="3" :placeholder="T('ReleaseNotesPlaceholder')"></el-input>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-body" shadow="hover" style="margin-top: 16px;">
      <el-table :data="listRes.list" v-loading="listRes.loading" border>
        <el-table-column prop="id" :label="T('Id')" min-width="60" align="center"></el-table-column>
        <el-table-column prop="version" :label="T('Version')" min-width="120" align="center">
          <template #default="{row}">
            <strong>{{ row.version }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="platform" :label="T('Platform')" min-width="100" align="center"></el-table-column>
        <el-table-column prop="url" :label="T('DownloadUrl')" min-width="200">
          <template #default="{row}">
            <el-text truncated>{{ row.url }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="note" :label="T('ReleaseNotes')" min-width="160">
          <template #default="{row}">
            <el-text truncated>{{ row.note }}</el-text>
          </template>
        </el-table-column>
        <el-table-column :label="T('Status')" min-width="80" align="center">
          <template #default="{row}">
            <el-tag v-if="row.status === 1" type="success" size="small">{{ T('Enable') }}</el-tag>
            <el-tag v-else type="danger" size="small">{{ T('Disable') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="T('ForceUpdate')" min-width="90" align="center">
          <template #default="{row}">
            <el-tag v-if="row.force_update === 1" type="warning" size="small">{{ T('Forced') }}</el-tag>
            <el-tag v-else type="info" size="small">{{ T('Normal') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="T('CreatedAt')" min-width="170" align="center">
          <template #default="{row}">
            {{ row.created_at || '' }}
          </template>
        </el-table-column>
        <el-table-column :label="T('Actions')" align="center" width="200" fixed="right">
          <template #default="{row}">
            <el-button :type="row.status === 1 ? 'danger' : 'primary'" @click="toggleStatus(row)" size="small">
              {{ row.status === 1 ? T('Disable') : T('Enable') }}
            </el-button>
            <el-button type="danger" @click="del(row)" size="small">{{ T('Delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card class="list-page" shadow="hover">
      <el-pagination background
                     layout="prev, pager, next, sizes, jumper"
                     :page-sizes="[10,20,50,100]"
                     v-model:page-size="listQuery.page_size"
                     v-model:current-page="listQuery.page"
                     :total="listRes.total"
                     @current-change="getList">
      </el-pagination>
    </el-card>
  </div>
</template>

<script setup>
import { list, create, remove, setEnable } from '@/api/version'
import { onMounted, reactive, ref } from 'vue'
import { T } from '@/utils/i18n'
import { ElMessage, ElMessageBox } from 'element-plus'

const form = reactive({
  version: '',
  platform: 'windows',
  status: 1,
  url: '',
  note: '',
  force_update: 0,
})

const submitting = ref(false)

const submitForm = async () => {
  if (!form.version || !form.url) {
    ElMessage.error(T('ParamRequired', { param: 'Version & URL' }))
    return
  }
  submitting.value = true
  const res = await create({
    version: form.version,
    platform: form.platform,
    status: form.status,
    url: form.url,
    note: form.note,
    force_update: form.force_update,
  }).catch(e => {
    ElMessage.error((e && e.message) || T('OperationFailed'))
    return false
  })
  submitting.value = false
  if (res) {
    ElMessage.success(T('OperationSuccess'))
    form.version = ''
    form.url = ''
    form.note = ''
    getList()
  }
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
  }
}
onMounted(getList)

const del = async (row) => {
  const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Delete') }), {
    confirmButtonText: T('Confirm'),
    cancelButtonText: T('Cancel'),
    type: 'warning',
  }).catch(_ => false)
  if (!cf) return false
  const res = await remove({ id: row.id }).catch(_ => false)
  if (res) {
    ElMessage.success(T('OperationSuccess'))
    getList()
  }
}

const toggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 2 : 1
  const res = await setEnable({ id: row.id, status: newStatus }).catch(_ => false)
  if (res) {
    ElMessage.success(T('OperationSuccess'))
    getList()
  }
}
</script>

<style scoped lang="scss">
.action-bar {
  margin-bottom: 12px;
}
.el-form--inline .el-form-item {
  margin-bottom: 8px;
}
</style>

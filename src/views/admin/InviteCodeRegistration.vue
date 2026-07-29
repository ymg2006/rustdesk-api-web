<template>
  <div>
    <el-card class="list-query query-card" shadow="hover">
      <el-form inline label-width="80px">
        <el-form-item>
          <el-button type="primary" @click="showCreate = true">{{ T('CreateInvitation') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Create invite-code dialog -->
    <el-dialog :title="T('CreateInvitation')" v-model="showCreate" width="500px">
      <el-form ref="createFormRef" :model="createForm" label-width="100px" :rules="createRules">
        <el-form-item label="Plan" prop="plan">
          <el-select v-model="createForm.plan" style="width:100%">
            <el-option label="Pro" value="pro" />
            <el-option label="Enterprise" value="enterprise" />
          </el-select>
        </el-form-item>
        <el-form-item label="Valid Days" prop="expire_days">
          <el-input-number v-model="createForm.expire_days" :min="1" :max="3650" style="width:200px" />
          <div style="margin-top:6px; display:flex; gap:4px; flex-wrap:wrap;">
            <el-button size="small" @click="createForm.expire_days = 30">1 Month</el-button>
            <el-button size="small" @click="createForm.expire_days = 90">3 Months</el-button>
            <el-button size="small" @click="createForm.expire_days = 365">1 Year</el-button>
            <el-button size="small" @click="createForm.expire_days = 3650">10 Years</el-button>
          </div>
          <span class="el-form-item__tip">Default is 30 days</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">{{ T('Cancel') }}</el-button>
        <el-button type="primary" @click="submitCreate" :loading="creating">{{ T('Submit') }}</el-button>
      </template>
    </el-dialog>

    <el-card class="list-body" shadow="hover">
      <el-table class="list-table" :data="list" v-loading="loading" border>
        <el-table-column prop="id" :label="T('ID')" align="center" min-width="80"/>
        <el-table-column prop="code" :label="T('InviteCode')" align="center" min-width="200">
          <template #default="{row}">
            <el-tag type="info" style="font-family: monospace; font-size: 13px;">{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Plan" align="center" min-width="100">
          <template #default="{row}">
            <el-tag :type="row.plan === 'pro' ? 'primary' : 'warning'" size="mini">{{ row.plan }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Status" align="center" min-width="100">
          <template #default="{row}">
            <el-tag
              :type="row.status === 'unused' ? 'success' : (row.status === 'used' ? 'info' : 'danger')"
              size="mini"
            >
              {{ row.status === 'unused' ? 'Unused' : (row.status === 'used' ? 'Used' : 'Revoked') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expire_at" :label="T('ExpiredAt')" align="center" min-width="180">
          <template #default="{row}">
            {{ row.expire_at || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="T('CreatedAt')" align="center" min-width="180">
          <template #default="{row}">
            {{ row.created_at || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="T('Actions')" align="center" width="200" fixed="right">
          <template #default="{row}">
            <el-button type="primary" @click="copySingleLink(row)" size="small">{{ T('CopyLink') }}</el-button>
            <el-button v-if="row.status === 'unused'" type="danger" @click="revoke(row)" size="small">{{ T('Revoke') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card class="list-page" shadow="hover">
      <el-pagination background
                     layout="prev, pager, next, sizes, jumper"
                     :page-sizes="[10,20,50,100]"
                     v-model:page-size="pageSize"
                     v-model:current-page="page"
                     :total="total">
      </el-pagination>
    </el-card>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { T } from '@/utils/i18n'
import { invitationList, invitationCreate, invitationRevoke } from '@/api/user'

  const showCreate = ref(false)
  const creating = ref(false)
  const loading = ref(false)
  const list = ref([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)

  const baseUrl = window.location.origin + '/#'

  const createFormRef = ref(null)
  const createForm = reactive({
    plan: 'pro',
    expire_days: 30,
  })
  const createRules = {
    plan: [{ required: true, message: 'Please select a plan', trigger: 'change' }],
    expire_days: [{ required: true, message: 'Please enter valid days', trigger: 'blur' }],
  }

  const getList = async () => {
    loading.value = true
    const res = await invitationList({ page: page.value, size: pageSize.value }).catch(_ => false)
    loading.value = false
    if (res && res.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  }

  watch(() => page.value, getList)
  watch(() => pageSize.value, () => { page.value = 1; getList() })

  const submitCreate = async () => {
    const v = await createFormRef.value.validate().catch(_ => false)
    if (!v) return
    creating.value = true
    const res = await invitationCreate({
      plan: createForm.plan,
      expire_days: createForm.expire_days,
    }).catch(_ => false)
    creating.value = false
    if (res && res.code === 0) {
      ElMessage.success(T('OperationSuccess'))
      showCreate.value = false
      getList()
    }
  }

  const revoke = async (row) => {
    const cf = await ElMessageBox.confirm(`Are you sure you want to revoke invite code ${row.code}?`, {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) return
    const res = await invitationRevoke(row.id).catch(_ => false)
    if (res && res.code === 0) {
      ElMessage.success(T('OperationSuccess'))
      getList()
    }
  }

  const copySingleLink = (row) => {
    const link = `${baseUrl}/register?invite_code=${row.code}`
    navigator.clipboard.writeText(link).then(() => {
      ElMessage.success(T('LinkCopied'))
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      ElMessage.success(T('LinkCopied'))
    })
  }

  onMounted(getList)
</script>

<style scoped>
</style>

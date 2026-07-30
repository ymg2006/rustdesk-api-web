<template>
  <div class="subscription-page">
    <el-card shadow="hover" class="query-card">
      <el-form inline>
        <el-form-item :label="T('Status')">
          <el-select v-model="filter.status" :placeholder="T('All')" clearable style="width:140px">
            <el-option :label="T('SubscribeActive')" value="active" />
            <el-option :label="T('SubscribeExpired')" value="expired" />
            <el-option :label="T('SubscribePermanent')" value="permanent" />
            <el-option :label="T('SubscribeNone')" value="none" />
          </el-select>
        </el-form-item>
        <el-form-item :label="T('Keyword')">
          <el-input v-model="filter.keyword" placeholder="User ID/Username" clearable style="width:200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList">{{ T('Filter') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="list-card query-card">
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="id" :label="T('ID')" min-width="60" align="center" />
        <el-table-column prop="username" label="Username" min-width="150" />
        <el-table-column prop="subscription_plan" label="Plan" min-width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.subscription_plan || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Subscription Status" min-width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ row.status === 'permanent' ? 'Permanent' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Days Left" min-width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.days_left === -1" style="color:#67c23a;font-weight:600">Permanent</span>
            <span v-else :style="{ color: row.days_left > 0 && row.days_left <= 7 ? '#f56c6c' : '#303133' }">
              {{ row.days_left > 0 ? row.days_left + ' days' : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Expiration Time" min-width="170" align="center">
          <template #default="{ row }">
            <span v-if="row.days_left === -1" style="color:#67c23a">—</span>
            <span v-else>{{ formatTime(row.subscription_expire_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('Action')" min-width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showExtend(row)">
              Extend
            </el-button>
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
                     :total="total"
                     @current-change="getList">
      </el-pagination>
    </el-card>

    <!-- Extend subscription dialog -->
    <el-dialog v-model="extendVisible" title="Extend Subscription" width="440px" :close-on-click-modal="false" append-to-body>
      <el-form label-position="top">
        <el-form-item label="User">
          <el-input :model-value="extendUser?.username" disabled />
        </el-form-item>
        <el-form-item label="Extension Duration">
          <div class="plan-grid">
            <div
              v-for="p in planOptions"
              :key="p.key"
              class="plan-card"
              :class="{ active: extendSelectedKey === p.key, 'forever-card': p.key === 'forever' }"
              @click="extendSelectedKey = p.key"
            >
              <el-icon v-if="p.key !== 'forever'" class="plan-icon"><el-icon-timer /></el-icon>
              <el-icon v-else class="plan-icon forever-icon"><el-icon-star-filled /></el-icon>
              <div class="plan-name">{{ p.name }}</div>
              <div v-if="p.price_cents != null" class="plan-price">¥{{ (p.price_cents / 100).toFixed(2) }}</div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="extendVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="extending" @click="handleExtend">Confirm Extension</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { T } from '@/utils/i18n'
import { ElMessage } from 'element-plus'
import { adminListSubscriptions, adminExtendSubscription, getPlans } from '@/api/subscribe'

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filter = reactive({
  status: '',
  keyword: '',
})

const extendVisible = ref(false)
const extendUser = ref(null)
const extendSelectedKey = ref('1m')
const planOptions = ref([])
const extending = ref(false)

const statusType = (s) => {
  if (s === 'active') return 'success'
  if (s === 'permanent') return 'success'
  if (s === 'expired') return 'danger'
  if (s === 'none') return 'info'
  return ''
}

const formatTime = (t) => {
  if (!t) return '-'
  return new Date(t).toLocaleString()
}

const getList = async () => {
  loading.value = true
  try {
    const res = await adminListSubscriptions({
      page: page.value,
      size: pageSize.value,
      status: filter.status || undefined,
      keyword: filter.keyword || undefined,
    })
    if (res.code) {
      ElMessage.error(res.message)
      return
    }
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (e) {
    ElMessage.error('Failed to get subscription list')
  } finally {
    loading.value = false
  }
}

const showExtend = (row) => {
  extendUser.value = row
  extendSelectedKey.value = '1m'
  extendVisible.value = true
}

const handleExtend = async () => {
  if (!extendUser.value || !extendSelectedKey.value) return
  const opt = planOptions.value.find(p => p.key === extendSelectedKey.value)
  if (!opt) return
  extending.value = true
  try {
    const res = await adminExtendSubscription({
      user_id: extendUser.value.id,
      plan: extendUser.value.subscription_plan || 'pro',
      plan_key: extendSelectedKey.value,
    })
    if (res.code) {
      ElMessage.error(res.message || 'Extension failed')
      return
    }
    ElMessage.success(`Extended subscription for user ${extendUser.value.username} by ${opt.name}`)
    extendVisible.value = false
    await getList()
  } catch (e) {
    ElMessage.error('Extension failed')
  } finally {
    extending.value = false
  }
}

onMounted(async () => {
  await getList()
  try {
    const res = await getPlans()
    if (!res.code && Array.isArray(res.data)) {
      const opts = res.data.map(p => p.key === 'forever' ? { ...p, price_cents: null } : p)
      planOptions.value = opts
    }
  } catch (_) {
    planOptions.value = [
      { key: '1m', name: '1 Month', price_cents: 1000, period_days: 30 },
      { key: '3m', name: '3 Months', price_cents: 2800, period_days: 90 },
      { key: '6m', name: '6 Months', price_cents: 5000, period_days: 180 },
      { key: '12m', name: '12 Months', price_cents: 8800, period_days: 365 },
      { key: 'forever', name: 'Permanent', price_cents: null, period_days: 0 },
    ]
  }
})
</script>

<style scoped>
.query-card {
  margin-bottom: 16px;
}
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
.plan-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
.plan-card {
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 14px 8px;
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 110px;
  flex-shrink: 0;
}
.plan-card:hover {
  border-color: #a6c8ff;
  box-shadow: 0 2px 8px rgba(64,158,255,0.12);
  transform: translateY(-2px);
}
.plan-card.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 0 0 1px #409eff;
}
.plan-card.active .plan-icon {
  color: #409eff;
}
.plan-icon {
  font-size: 38px;
  color: #909399;
  transition: color 0.25s;
}
.plan-card .plan-icon,
.plan-card .forever-icon {
  font-size: 38px !important;
  width: 38px !important;
  height: 38px !important;
}
/* Permanent card */
.forever-card {
  background: linear-gradient(135deg, #fdf6ec 0%, #fff 100%);
  border-color: #e6a23c;
}
.forever-card:hover {
  border-color: #e6a23c;
  box-shadow: 0 2px 10px rgba(230,162,60,0.25);
}
.forever-card.active {
  border-color: #e6a23c;
  background: #fdf6ec;
  box-shadow: 0 0 0 1px #e6a23c;
}
.forever-card .forever-icon {
  color: #e6a23c;
}
.forever-card.active .forever-icon {
  color: #d48806;
}
.plan-name {
  font-size: 14px;
  font-weight: 600;
}
.plan-price {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}
</style>

<template>
  <div class="order-page">
    <el-card shadow="hover" class="query-card">
      <el-form inline>
        <el-form-item :label="T('Status')">
          <el-select v-model="filter.status" :placeholder="T('All')" clearable style="width:130px">
            <el-option :label="T('OrderStatusPending')" value="pending" />
            <el-option :label="T('OrderStatusPaid')" value="paid" />
            <el-option :label="T('OrderStatusClosed')" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item :label="T('Keyword')">
          <el-input v-model="filter.keyword" :placeholder="T('OrderNoUsername')" clearable style="width:200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList">{{ T('Filter') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="list-card query-card">
      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="id" :label="T('ID')" min-width="60" align="center" />
        <el-table-column prop="out_trade_no" :label="T('OrderNo')" min-width="220" />
        <el-table-column prop="username" :label="T('User')" min-width="120" align="center" />
        <el-table-column :label="T('Duration')" min-width="80" align="center">
          <template #default="{ row }">
            {{ row.plan_key }}
          </template>
        </el-table-column>
        <el-table-column :label="T('Amount')" min-width="100" align="center">
          <template #default="{ row }">
            ¥{{ (row.amount_cents / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="channel" :label="T('PaymentMethod')" min-width="100" align="center">
          <template #default="{ row }">
            {{ row.channel === 'alipay' ? T('Alipay') : T('WeChatPay') }}
          </template>
        </el-table-column>
        <el-table-column :label="T('Status')" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="T('OrderTime')" min-width="170" align="center">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="T('Action')" min-width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="success" size="small" @click="handleConfirm(row)">
              {{ T('ConfirmPaid') }}
            </el-button>
            <el-button v-if="row.status === 'pending'" type="warning" size="small" @click="handleClose(row)">
              {{ T('Close') }}
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { T } from '@/utils/i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminListOrders, adminConfirmOrder, adminCloseOrder } from '@/api/subscribe'

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filter = reactive({
  status: '',
  keyword: '',
})

const statusType = (s) => {
  if (s === 'paid') return 'success'
  if (s === 'pending') return 'warning'
  if (s === 'closed') return 'info'
  return ''
}
const statusLabel = (s) => {
  if (s === 'paid') return T('OrderStatusPaid')
  if (s === 'pending') return T('OrderStatusPending')
  if (s === 'closed') return T('OrderStatusClosed')
  return s
}

const formatTime = (t) => {
  if (!t) return '-'
  return new Date(t).toLocaleString()
}

const getList = async () => {
  loading.value = true
  try {
    const res = await adminListOrders({
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
    ElMessage.error(T('OrderListLoadFailed'))
  } finally {
    loading.value = false
  }
}

const handleConfirm = async (row) => {
  try {
    await ElMessageBox.confirm(T('ConfirmOrderPaid', { order: row.out_trade_no }), T('Confirm'))
  } catch {
    return
  }
  const res = await adminConfirmOrder(row.id)
  if (res.code) {
    ElMessage.error(res.message || T('ConfirmationFailed'))
    return
  }
  ElMessage.success(T('ConfirmedSuccessfully'))
  await getList()
}

const handleClose = async (row) => {
  try {
    await ElMessageBox.confirm(T('ConfirmCloseOrder', { order: row.out_trade_no }), T('Confirm'))
  } catch {
    return
  }
  const res = await adminCloseOrder(row.id)
  if (res.code) {
    ElMessage.error(res.message || T('CloseFailed'))
    return
  }
  ElMessage.success(T('Closed'))
  await getList()
}

onMounted(getList)
</script>

<style scoped>
.query-card {
  margin-bottom: 16px;
}
</style>

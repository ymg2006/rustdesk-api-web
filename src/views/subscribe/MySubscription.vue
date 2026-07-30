<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ T('MySubscription') }}</span>
          <div class="header-actions">
            <!-- <el-button type="primary" size="small" @click="showPayment = true">
              {{ T('SubscribeUpgrade') }}
            </el-button> -->
            <el-button size="small" @click="showClaim = true">
              {{ T('SubscribeRedeemCode') }}
            </el-button>
          </div>
        </div>
      </template>

      <el-skeleton :loading="loading" animated>
        <template #default>
          <div v-if="hasData" class="subscription-info">
            <!-- Status indicator -->
            <!-- <div class="status-badge" :class="statusClass">
              <el-icon v-if="mine.status === 'active'"><el-icon-success-filled /></el-icon>
              <el-icon v-else-if="mine.status === 'expired'"><el-icon-warning-filled /></el-icon>
              <el-icon v-else><el-icon-circle-close-filled /></el-icon>
              <span>{{ statusText }}</span>
            </div> -->

            <el-descriptions :column="2" border class="info-table">
              <el-descriptions-item :label="T('Plan')">
                <el-tag type="primary">{{ mine.plan || '-' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item :label="T('Status')">
                <el-tag :type="statusTagType">{{ statusText }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item :label="T('SubscribeExpireAt')">
                {{ mine.subscription_expire_at ? formatTime(mine.subscription_expire_at) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item :label="T('SubscribeDaysLeft')">
                <span v-if="mine.status === 'active'" class="days-left" :class="{ urgent: mine.days_left <= 3 }">
                  {{ T('Days', { param: mine.days_left }) }}
                </span>
                <span v-else>-</span>
              </el-descriptions-item>
            </el-descriptions>

            <!-- Expiration reminder -->
            <el-alert
              v-if="mine.is_expiring_soon && mine.status === 'active'"
              :title="T('SubscribeExpiringSoon')"
              type="warning"
              show-icon
              :closable="false"
              class="expiring-alert"
            />
          </div>

          <!-- Unsubscribed state -->
          <div v-else class="no-subscription">
            <el-empty :description="T('SubscribeNoSubscription')">
              <!-- <el-button type="primary" @click="showPayment = true">
                {{ T('SubscribeUpgradeNow') }}
              </el-button> -->
            </el-empty>
          </div>
        </template>
      </el-skeleton>
    </el-card>

    <!-- Payment dialog -->
    <PaymentDialog
      v-model:visible="showPayment"
      @activated="refresh"
    />

    <!-- Redemption dialog -->
    <ClaimCode
      v-model:visible="showClaim"
      @activated="refresh"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { T } from '@/utils/i18n'
import { getMine } from '@/api/subscribe'
import PaymentDialog from './PaymentDialog.vue'
import ClaimCode from './ClaimCode.vue'

const loading = ref(true)
const mine = ref({})
const showPayment = ref(false)
const showClaim = ref(false)

const hasData = computed(() => {
  return mine.value && mine.value.status && mine.value.status !== 'none'
})

const statusText = computed(() => {
  const map = { active: T('SubscribeActive'), expired: T('SubscribeExpired'), none: T('SubscribeNone') }
  return map[mine.value.status] || mine.value.status
})

const statusTagType = computed(() => {
  const map = { active: 'success', expired: 'danger', none: 'info' }
  return map[mine.value.status] || 'info'
})

const refresh = async () => {
  loading.value = true
  try {
    const res = await getMine()
    if (!res.code) {
      mine.value = res.data || {}
    }
  } catch (_) {
    // ignore
  } finally {
    loading.value = false
  }
}

const formatTime = (t) => {
  if (!t) return '-'
  return new Date(t).toLocaleString()
}

onMounted(refresh)
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.subscription-info {
  position: relative;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
}
.status-active {
  background: #f0f9eb;
  color: #67c23a;
}
.status-expired {
  background: #fef0f0;
  color: #f56c6c;
}
.status-none {
  background: #f4f4f5;
  color: #909399;
}
.info-table {
  margin-bottom: 16px;
}
.days-left {
  font-weight: 600;
  color: #67c23a;
}
.days-left.urgent {
  color: #f56c6c;
}
.expiring-alert {
  margin-top: 12px;
}
.no-subscription {
  text-align: center;
  padding: 40px 0;
}
</style>

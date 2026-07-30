<template>
  <el-dialog
    :model-value="visible"
    :title="T('SubscribeUpgrade')"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @closed="handleClosed"
    append-to-body
  >
    <!-- Step 1: select duration and payment channel -->
    <template v-if="step === 'select'">
      <div class="plan-section">
        <div class="section-label">{{ T('SubscribeSelectDuration') }}</div>
        <div class="plan-grid">
          <div
            v-for="p in plans"
            :key="p.key"
            class="plan-card"
            :class="{ active: selectedPlanKey === p.key }"
            @click="selectedPlanKey = p.key"
          >
            <div class="plan-icon-wrap">
              <el-icon class="plan-icon-timer"><el-icon-timer /></el-icon>
            </div>
            <div class="plan-name">{{ p.name }}</div>
            <div class="plan-price">¥{{ (p.price_cents / 100).toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <div class="channel-section">
        <div class="section-label">{{ T('SubscribeSelectChannel') }}</div>
        <el-radio-group v-model="channel" class="channel-group">
          <el-radio value="alipay" border class="channel-radio">
            <el-icon><el-icon-coin /></el-icon>
            {{ T('Alipay') }}
          </el-radio>
          <el-radio value="wechat" border class="channel-radio">
            <el-icon><el-icon-chat-dot-round /></el-icon>
            {{ T('WechatPay') }}
          </el-radio>
        </el-radio-group>
      </div>

      <div class="dialog-footer-actions">
        <el-button @click="$emit('update:visible', false)">{{ T('Cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreateOrder">
          {{ T('SubscribePayNow') }}
        </el-button>
      </div>
    </template>

    <!-- Step 2: show payment QR code (cashier) -->
    <template v-if="step === 'qrcode'">
      <div class="cashier">
        <!-- Product information -->
        <div class="cashier-header">
          <div class="cashier-product">{{ selectedPlanName }} · RustDesk Subscription</div>
          <div class="cashier-amount">
            <span class="amount-symbol">¥</span>
            <span class="amount-value">{{ displayAmount }}</span>
          </div>
        </div>

        <!-- QR code area -->
        <div class="cashier-qr">
          <div class="qrcode-wrapper" v-loading="!qrPayload">
            <div class="qrcode-inner" :class="{ 'qr-expired': countdownExpired }">
              <img v-if="qrPayload" :src="qrImageSrc" alt="Payment QR code" class="qrcode-img" />
              <div v-if="countdownExpired" class="qr-overlay">
                <el-icon class="overlay-icon"><el-icon-circle-close-filled /></el-icon>
                <span class="overlay-text">{{ T('OrderExpired') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Countdown -->
        <div class="cashier-timer" :class="{ expired: countdownExpired }">
          <template v-if="!countdownExpired">
            <el-icon><el-icon-alarm-clock /></el-icon>
            QR code valid for:
            <span class="timer-value">{{ timerMin }}</span> min
            <span class="timer-value">{{ timerSec }}</span> sec
            , do not pay after expiration
          </template>
          <template v-else>
            <span class="timer-expired">{{ T('OrderQrCodeExpired') }}</span>
          </template>
        </div>

        <!-- Amount warning (red and prominent) -->
        <div class="cashier-warning">
          <el-icon><el-icon-warning-filled /></el-icon>
          Please pay exactly <strong>¥{{ displayAmount }}</strong>; do not overpay or underpay
        </div>

        <!-- Action buttons -->
        <div class="cashier-actions">
          <el-button size="small" @click="copyAmount">
            <el-icon><el-icon-copy-document /></el-icon>
            Copy Amount ¥{{ displayAmount }}
          </el-button>
        </div>

        <!-- Order information -->
        <div class="cashier-footer">
          <div class="footer-row">
            <span class="footer-label">{{ T('MerchantOrderNo') }}</span>
            <span class="footer-value">{{ orderInfo.out_trade_no }}</span>
          </div>
          <div class="footer-row">
            <span class="footer-label">{{ T('PaymentMethod') }}</span>
            <span class="footer-value">{{ channel === 'alipay' ? 'Alipay' : 'WeChat Pay' }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Step 3: payment successful, show invite code -->
    <template v-if="step === 'success'">
      <div class="success-section">
        <el-result icon="success" :title="T('SubscribeSuccess')">
          <template #sub-title>
            <p>{{ T('SubscribeCodeTitle') }}</p>
            <div class="invite-code-box" @click="copyCode">
              <code class="invite-code">{{ inviteCode }}</code>
              <el-icon><el-icon-copy-document /></el-icon>
            </div>
            <p class="code-hint">{{ T('SubscribeCodeHint') }}</p>
          </template>
          <template #extra>
            <el-button type="primary" @click="$emit('update:visible', false)">
              {{ T('GotIt') }}
            </el-button>
          </template>
        </el-result>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { T } from '@/utils/i18n'
import { ElMessage } from 'element-plus'
import { createOrder, queryOrder, getPlans } from '@/api/subscribe'

const props = defineProps({
  visible: Boolean,
})
const emit = defineEmits(['update:visible', 'activated'])

// Countdown parameters
const COUNTDOWN_SEC = 300 // 5 minutes

const step = ref('select') // select | qrcode | success
const plans = ref([])
const selectedPlanKey = ref('1m')
const channel = ref('alipay')
const creating = ref(false)
const orderInfo = ref({})
const qrPayload = ref('')
const inviteCode = ref('')
const countdownLeft = ref(COUNTDOWN_SEC)
const countdownExpired = ref(false)
let countdownTimer = null
let pollingTimer = null

const selectedPlanName = computed(() => {
  const p = plans.value.find(x => x.key === selectedPlanKey.value)
  return p ? p.name : ''
})
const selectedPrice = computed(() => {
  const p = plans.value.find(x => x.key === selectedPlanKey.value)
  return p ? p.price_cents : 0
})

const displayAmount = computed(() => {
  return (selectedPrice.value / 100).toFixed(2)
})

const timerMin = computed(() => {
  return String(Math.floor(countdownLeft.value / 60)).padStart(2, '0')
})
const timerSec = computed(() => {
  return String(countdownLeft.value % 60).padStart(2, '0')
})

const qrImageSrc = computed(() => {
  if (!qrPayload.value) return ''
  return qrPayload.value
})

// Load available durations
onMounted(async () => {
  try {
    const res = await getPlans()
    if (!res.code && Array.isArray(res.data)) {
      const userPlans = res.data.filter(p => p.key !== 'forever')
      if (userPlans.length > 0) {
        plans.value = userPlans
        selectedPlanKey.value = userPlans[0].key
      }
    }
  } catch (_) {
    plans.value = [
      { key: '1m', name: '1 Month', price_cents: 1000, period_days: 30 },
      { key: '3m', name: '3 Months', price_cents: 2800, period_days: 90 },
      { key: '6m', name: '6 Months', price_cents: 5000, period_days: 180 },
      { key: '12m', name: '12 Months', price_cents: 8800, period_days: 365 },
    ]
  }
})

const handleCreateOrder = async () => {
  if (!channel.value) {
    ElMessage.warning(T('SubscribeSelectChannelFirst'))
    return
  }
  if (!selectedPlanKey.value) {
    ElMessage.warning(T('SubscribeSelectDuration'))
    return
  }
  creating.value = true
  try {
    const res = await createOrder(channel.value, selectedPlanKey.value)
    if (res.code) {
      ElMessage.error(res.message || T('SubscribeCreateFailed'))
      return
    }
    orderInfo.value = res.data
    qrPayload.value = res.data.qr_payload || ''
    step.value = 'qrcode'
    startCountdown()
    startPolling(res.data.out_trade_no)
  } catch (e) {
    ElMessage.error(T('SubscribeCreateFailed'))
  } finally {
    creating.value = false
  }
}

const startCountdown = () => {
  countdownLeft.value = COUNTDOWN_SEC
  countdownExpired.value = false
  countdownTimer = setInterval(() => {
    countdownLeft.value--
    if (countdownLeft.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      countdownExpired.value = true
    }
  }, 1000)
}

const startPolling = (outTradeNo) => {
  pollingTimer = setInterval(async () => {
    try {
      const res = await queryOrder(outTradeNo)
      if (res.code) return
      const data = res.data
      if (data.status === 'paid' && data.code_issued) {
        clearInterval(pollingTimer)
        pollingTimer = null
        inviteCode.value = data.invite_code || ''
        step.value = 'success'
        emit('activated')
      }
    } catch (_) {
      // Ignore polling errors
    }
  }, 3000)
}

const copyAmount = () => {
  const text = displayAmount.value
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(T('CopySuccess'))
  }).catch(() => {
    ElMessage.warning(T('CopyFailed'))
  })
}

const copyCode = () => {
  if (!inviteCode.value) return
  navigator.clipboard.writeText(inviteCode.value).then(() => {
    ElMessage.success(T('CopySuccess'))
  }).catch(() => {
    ElMessage.warning(T('CopyFailed'))
  })
}

const handleClosed = () => {
  step.value = 'select'
  orderInfo.value = {}
  qrPayload.value = ''
  inviteCode.value = ''
  countdownLeft.value = COUNTDOWN_SEC
  countdownExpired.value = false
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

watch(() => props.visible, (val) => {
  if (!val) {
    handleClosed()
  }
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (pollingTimer) clearInterval(pollingTimer)
})
</script>

<style scoped>
/* ====== Step 1: select duration ====== */
.plan-section {
  margin-bottom: 20px;
}
.section-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #606266;
}
.plan-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
.plan-card {
  border: 2px solid #e4e7ed;
  border-radius: 10px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  width: 140px;
  flex-shrink: 0;
}
.plan-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}
.plan-card.active .plan-icon-timer {
  color: #409eff;
}
/* Permanent card */
.forever-card {
  background: linear-gradient(135deg, #fdf6ec 0%, #fff 100%);
  border-color: #e6a23c;
}
.forever-card:hover {
  border-color: #e6a23c;
  box-shadow: 0 2px 10px rgba(230,162,60,0.2);
}
.forever-card.active {
  border-color: #e6a23c;
  background: #fdf6ec;
}
.forever-badge {
  margin-bottom: 4px;
}
.forever-star {
  font-size: 36px;
  color: #e6a23c;
}
.plan-icon-wrap {
  margin-bottom: 4px;
}
.plan-icon-timer {
  font-size: 36px;
  color: #909399;
}
.plan-card.active .forever-star {
  color: #d48806;
}
.plan-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}
.plan-price {
  font-size: 22px;
  font-weight: 700;
  color: #409eff;
}
.forever-card .plan-price {
  color: #e6a23c;
}
.channel-section {
  margin-bottom: 20px;
}
.channel-group {
  display: flex;
  gap: 12px;
}
.channel-radio {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ====== Step 2: cashier ====== */
.cashier {
  text-align: center;
}
.cashier-header {
  margin-bottom: 16px;
}
.cashier-product {
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}
.cashier-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
}
.amount-symbol {
  font-size: 20px;
  color: #f56c6c;
  font-weight: 600;
}
.amount-value {
  font-size: 40px;
  font-weight: 700;
  color: #f56c6c;
  line-height: 1;
}

/* QR code */
.cashier-qr {
  margin-bottom: 12px;
}
.qrcode-wrapper {
  display: inline-block;
  padding: 10px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  position: relative;
}
.qrcode-inner {
  position: relative;
  width: 200px;
  height: 200px;
}
.qrcode-img {
  width: 200px;
  height: 200px;
  display: block;
}
.qr-expired .qrcode-img {
  filter: blur(4px);
}
.qr-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.6);
  border-radius: 8px;
  z-index: 2;
}
.overlay-icon {
  font-size: 40px;
  color: #c0c4cc;
  margin-bottom: 8px;
}
.overlay-text {
  font-size: 16px;
  font-weight: 600;
  color: #909399;
}

/* Countdown */
.cashier-timer {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.timer-value {
  color: #f56c6c;
  font-size: 22px;
  font-weight: 700;
}
.cashier-timer.expired .timer-value {
  color: #909399;
}
.timer-expired {
  color: #909399;
  font-size: 18px;
  font-weight: 600;
}

/* Amount warning (red and prominent) */
.cashier-warning {
  background: #fef0f0;
  color: #f56c6c;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.cashier-warning strong {
  font-size: 15px;
}

/* Action buttons */
.cashier-actions {
  margin-bottom: 14px;
}

/* Order information */
.cashier-footer {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px 14px;
  text-align: left;
}
.footer-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 3px 0;
}
.footer-label {
  color: #909399;
}
.footer-value {
  color: #303133;
  font-family: monospace;
}

/* ====== Step 3: success ====== */
.success-section {
  text-align: center;
}
.invite-code-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  padding: 12px 20px;
  margin: 12px 0;
  cursor: pointer;
  transition: background 0.2s;
}
.invite-code-box:hover {
  background: #ecf5ff;
}
.invite-code {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #409eff;
}
.code-hint {
  font-size: 12px;
  color: #909399;
}
</style>

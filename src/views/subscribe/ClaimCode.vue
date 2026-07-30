<template>
  <el-dialog
    :model-value="visible"
    :title="T('SubscribeRedeemCode')"
    width="420px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @closed="handleClosed"
    append-to-body
  >
    <el-form label-position="top">
      <el-form-item :label="T('SubscribeInputCode')">
        <el-input
          v-model="code"
          :placeholder="T('SubscribeCodePlaceholder')"
          size="large"
          clearable
          @keyup.enter="handleRedeem"
        >
          <template #prefix>
            <el-icon><el-icon-key /></el-icon>
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <div v-if="result" class="result-section">
      <el-alert
        :title="result.success ? T('SubscribeRedeemSuccess') : T('SubscribeRedeemFailed')"
        :type="result.success ? 'success' : 'error'"
        :description="result.message"
        show-icon
        :closable="false"
      />
      <div v-if="result.success && result.data" class="result-detail">
        <p><strong>{{ T('Plan') }}:</strong> {{ result.data.plan }}</p>
        <p v-if="result.data.subscription_expire_at">
          <strong>{{ T('SubscribeExpireAt') }}:</strong> {{ formatTime(result.data.subscription_expire_at) }}
        </p>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">{{ T('Cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="handleRedeem">
        {{ T('SubscribeRedeem') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { T } from '@/utils/i18n'
import { ElMessage } from 'element-plus'
import { redeemCode } from '@/api/subscribe'

const props = defineProps({
  visible: Boolean,
})
const emit = defineEmits(['update:visible', 'activated'])

const code = ref('')
const loading = ref(false)
const result = ref(null)

const handleRedeem = async () => {
  if (!code.value.trim()) {
    ElMessage.warning(T('SubscribeInputCodeFirst'))
    return
  }
  loading.value = true
  result.value = null
  try {
    const res = await redeemCode(code.value.trim())
    if (!res.code) {
      result.value = {
        success: true,
        message: T('SubscribeRedeemSuccessDesc'),
        data: res.data,
      }
      emit('activated')
    } else {
      const msgs = {
        4201: T('CodeNotFound'),
        4202: T('CodeUsed'),
        4203: T('CodeRevoked'),
        4204: T('CodeExpired'),
      }
      result.value = {
        success: false,
        message: msgs[res.code] || res.message || T('SubscribeRedeemFailed'),
      }
    }
  } catch (e) {
    result.value = {
      success: false,
      message: T('SubscribeRedeemFailed'),
    }
  } finally {
    loading.value = false
  }
}

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  return d.toLocaleString()
}

const handleClosed = () => {
  code.value = ''
  result.value = null
}
</script>

<style scoped>
.result-section {
  margin-bottom: 16px;
}
.result-detail {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color);
  border-radius: 6px;
}
.result-detail p {
  margin: 4px 0;
  font-size: 14px;
}
</style>

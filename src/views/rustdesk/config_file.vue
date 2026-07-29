<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>{{ T('ConfigFile') }}</span>
          <div>
            <el-button size="small" @click="reset" :disabled="loading">{{ T('Reset') }}</el-button>
            <el-button size="small" type="primary" @click="save" :loading="saving">{{ T('Save') }}</el-button>
          </div>
        </div>
      </template>

      <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 12px" :title="T('ConfigFileTip')" />

      <el-form label-width="130px" style="margin-bottom: 12px;">
        <el-form-item :label="T('ConfigFilePath')">
          <el-input :model-value="path" readonly />
        </el-form-item>
      </el-form>

      <el-input
        v-model="content"
        type="textarea"
        :rows="26"
        :disabled="loading"
        style="font-family: monospace; font-size: 13px;"
        placeholder="yaml"
      />

      <el-divider />

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: var(--apple-gray); font-size: 13px;">{{ T('ServiceRestartTip') }}</span>
        <el-button type="danger" :loading="restarting" @click="restartService">
          <el-icon v-if="!restarting"><RefreshRight /></el-icon>
          {{ T('RestartService') }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { T } from '@/utils/i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RefreshRight } from '@element-plus/icons-vue'
import { fileGet, fileUpdate, serviceRestart } from '@/api/config'

const content = ref('')
const path = ref('')
const loading = ref(false)
const saving = ref(false)
const restarting = ref(false)

const fetchConfig = async () => {
  loading.value = true
  const res = await fileGet().catch(_ => false)
  loading.value = false
  if (res && res.data) {
    content.value = res.data.content || ''
    path.value = res.data.path || ''
  }
}

const reset = () => {
  fetchConfig()
}

const save = async () => {
  if (!content.value) {
    ElMessage.warning('配置内容不能为空')
    return
  }
  saving.value = true
  const res = await fileUpdate(content.value).catch(_ => false)
  saving.value = false
  if (res) {
    ElMessage.success(T('OperationSuccess'))
  }
}

const restartState = { done: false, timer: null }

const restartService = async () => {
  restartState.done = false
  if (restartState.timer) { clearInterval(restartState.timer); restartState.timer = null }
  const boxPromise = ElMessageBox.confirm(
    T('ConfirmRestartWithCountdown', { param: T('RestartService'), seconds: 10 }),
    { type: 'warning', confirmButtonText: T('Confirm'), cancelButtonText: T('Cancel'),
      beforeClose: (action, instance, done) => {
        if (action !== 'confirm') {
          if (restartState.timer) { clearInterval(restartState.timer); restartState.timer = null }
          done()
          return
        }
        // 仅倒计时结束后允许确认关闭
        if (restartState.done) done()
      }
    }
  )
  // 确认框渲染后启动 10 秒倒计时
  setTimeout(startRestartCountdown, 50)
  const cf = await boxPromise.catch(_ => false)
  if (restartState.timer) { clearInterval(restartState.timer); restartState.timer = null }
  if (!cf) return
  restarting.value = true
  const res = await serviceRestart().catch(_ => false)
  if (res) {
    ElMessage.success(T('ServiceRestarting'))
    // 服务即将重启，给予提示后刷新页面以重新建立连接
    setTimeout(() => window.location.reload(), 3000)
  } else {
    restarting.value = false
  }
}

// 进入确认框即启动 10 秒倒计时，期间禁用确认按钮
const startRestartCountdown = () => {
  const boxes = document.querySelectorAll('.el-message-box')
  const box = boxes[boxes.length - 1]
  if (!box) return
  const btn = box.querySelector('.el-message-box__btns .el-button--primary')
  const msg = box.querySelector('.el-message-box__message')
  if (btn) btn.disabled = true
  let left = 10
  const tick = () => {
    left -= 1
    if (msg) msg.textContent = T('ConfirmRestartWithCountdown', { param: T('RestartService'), seconds: left })
    if (left <= 0) {
      if (btn) btn.disabled = false
      if (msg) msg.textContent = T('Confirm?', { param: T('RestartService') })
      restartState.done = true
      if (restartState.timer) { clearInterval(restartState.timer); restartState.timer = null }
    }
  }
  restartState.timer = setInterval(tick, 1000)
}

onMounted(() => {
  fetchConfig()
})
</script>

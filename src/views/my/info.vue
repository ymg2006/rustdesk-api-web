<template>
  <div class="profile-page">
    <div class="profile-hero apple-glass">
      <div class="hero-avatar">
        <div class="avatar-ring">
          <span class="avatar-text">{{ avatarLetter }}</span>
        </div>
      </div>
      <div class="hero-info">
        <h1 class="hero-name">{{ userStore.username }}</h1>
        <p v-if="userStore.email" class="hero-email">
          <svg class="hero-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          {{ userStore.email }}
        </p>
        <p class="hero-role">
          <el-tag type="primary" size="small" round>{{T('Administrator')}}</el-tag>
        </p>
      </div>
      <div class="hero-actions">
        <el-button type="danger" round @click="showChangePwd">
          <svg style="width:14px;height:14px;margin-right:4px;vertical-align:-2px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          {{ T('ChangePassword') }}
        </el-button>
      </div>
    </div>

    <!-- ====== Content grid ====== -->
    <div class="profile-grid">
      <!-- Left column: OIDC + MFA -->
      <div class="profile-col">
        <!-- OIDC card -->
        <div class="glass-card">
          <div class="card-header">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>OIDC {{ T('Binding') }}</span>
          </div>
          <div v-if="oidcData && oidcData.length > 0" class="oidc-list">
            <div v-for="(row, idx) in oidcData" :key="idx" class="oidc-item">
              <div class="oidc-provider">
                <span class="oidc-name">{{ row.op || 'Unknown' }}</span>
                <el-tag v-if="row.status === 1" type="success" size="small" round>{{ T('HasBind') }}</el-tag>
                <el-tag v-else type="danger" size="small" round>{{ T('NoBind') }}</el-tag>
              </div>
              <el-button
                v-if="row.status === 1"
                type="danger"
                size="small"
                text
                @click="toUnBind(row)"
              >{{ T('UnBind') }}</el-button>
              <el-button
                v-else
                type="primary"
                size="small"
                text
                @click="toBind(row)"
              >{{ T('ToBind') }}</el-button>
            </div>
          </div>
          <div v-else class="empty-state">
            <svg viewBox="0 0 64 64" fill="none" width="48" height="48" stroke="var(--apple-gray)" stroke-width="1.5"><circle cx="32" cy="32" r="28"/><path d="M32 20v16M32 42h.02"/></svg>
            <span>{{ T('NoData') || 'No data' }}</span>
          </div>
        </div>

        <!-- MFA card -->
        <div class="glass-card">
          <div class="card-header">
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <span>{{ T('MfaTitle') }}</span>
            <el-tag
              :type="mfaEnabled ? 'success' : 'info'"
              size="small"
              round
              style="margin-left:auto"
            >{{ mfaEnabled ? T('MfaEnabled') : T('MfaDisabled') }}</el-tag>
          </div>
          <div class="mfa-body">
            <div class="mfa-status-row">
              <div class="status-indicator" :class="{ active: mfaEnabled }">
                <span class="status-dot"></span>
                <span>{{ mfaEnabled ? T('MfaEnabled') : T('MfaDisabled') }}</span>
              </div>
            </div>
            <el-button
              v-if="!mfaEnabled"
              type="primary"
              round
              style="width:100%;margin-top:16px"
              @click="openSetup"
            >
              <svg style="width:14px;height:14px;margin-right:6px;vertical-align:-2px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ T('MfaSetup') }}
            </el-button>
            <el-button
              v-else
              type="danger"
              round
              plain
              style="width:100%;margin-top:16px"
              @click="disableMfa"
            >
              {{ T('MfaDisable') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- Right column: welcome message / announcement -->
      <div class="profile-col">
        <div class="glass-card welcome-card" v-if="html">
          <div class="welcome-content" v-html="html"></div>
        </div>
      </div>
    </div>

    <!-- Keep the dialog unchanged. -->
    <el-dialog v-model="setupVisible" :title="T('MfaSetup')" width="480px" class="glass-dialog" append-to-body>
      <div v-if="setupData">
        <p>{{ T('MfaScanTip') }}</p>
        <div style="text-align:center;margin:12px 0">
          <img v-if="setupData.qr" :src="setupData.qr" alt="qr" style="width:200px;height:200px;border-radius:12px" />
        </div>
        <el-form>
          <el-form-item :label="T('MfaSecret')">
            <el-input :model-value="setupData.secret" readonly>
              <template #append>
                <el-button @click="copySecret">{{ T('Copy') }}</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item :label="T('MfaCode')">
            <el-input v-model="enableCode" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="setupVisible = false">{{ T('Cancel') }}</el-button>
        <el-button type="primary" :loading="enabling" @click="enableMfa">{{ T('MfaEnable') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recoveryVisible" :title="T('MfaRecoveryCodes')" width="480px" class="glass-dialog" append-to-body>
      <el-alert :title="T('MfaRecoveryTip')" type="warning" :closable="false" show-icon />
      <ul style="margin-top:12px;font-family:monospace;font-size:14px;line-height:1.8;padding-left:20px">
        <li v-for="(c, i) in recoveryCodes" :key="i">{{ c }}</li>
      </ul>
      <template #footer>
        <el-button type="primary" @click="recoveryVisible = false">{{ T('Confirm') }}</el-button>
      </template>
    </el-dialog>

    <changePwdDialog v-model:visible="changePwdVisible"></changePwdDialog>
  </div>
</template>

<script setup>
  import changePwdDialog from '@/components/changePwdDialog.vue'
import { computed, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { bind, unbind } from '@/api/oauth'
import { myOauth, mfaSetup, mfaEnable, mfaDisable, mfaStatus } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { T } from '@/utils/i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

  const appStore = useAppStore()
  const userStore = useUserStore()
  const changePwdVisible = ref(false)
  const showChangePwd = () => {
    changePwdVisible.value = true
  }

  // Avatar initial.
  const avatarLetter = computed(() => {
    const name = userStore.username || 'U'
    return name.charAt(0).toUpperCase()
  })

  // OIDC
  const oidcData = ref([])
  const getMyOauth = async () => {
    const res = await myOauth().catch(_ => false)
    if (res) {
      oidcData.value = res.data
    }
  }
  getMyOauth()

  // MFA
  const mfaEnabled = ref(false)
  const setupVisible = ref(false)
  const setupData = ref(null)
  const enableCode = ref('')
  const enabling = ref(false)
  const recoveryVisible = ref(false)
  const recoveryCodes = ref([])

  const loadMfaStatus = async () => {
    const res = await mfaStatus().catch(_ => false)
    if (res) {
      mfaEnabled.value = !!res.data.mfa_enabled
    }
  }
  loadMfaStatus()

  const openSetup = async () => {
    const res = await mfaSetup().catch(_ => false)
    if (res) {
      setupData.value = res.data
      enableCode.value = ''
      setupVisible.value = true
    }
  }
  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(setupData.value.secret)
      ElMessage.success(T('OperationSuccess'))
    } catch (e) {
      ElMessage.warning(setupData.value.secret)
    }
  }
  const enableMfa = async () => {
    if (!enableCode.value) {
      ElMessage.warning(T('MfaCodeRequired'))
      return
    }
    enabling.value = true
    const res = await mfaEnable({ code: enableCode.value }).catch(_ => false)
    enabling.value = false
    if (res) {
      recoveryCodes.value = res.data.recovery_codes || []
      setupVisible.value = false
      mfaEnabled.value = true
      recoveryVisible.value = true
      ElMessage.success(T('MfaEnabled'))
    }
  }
  const disableMfa = async () => {
    const cf = await ElMessageBox.prompt(T('MfaDisableConfirm'), T('MfaDisable'), {
      inputType: 'password',
      inputPlaceholder: T('Password'),
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) return
    const res = await mfaDisable({ password: cf.value }).catch(_ => false)
    if (res) {
      mfaEnabled.value = false
      ElMessage.success(T('MfaDisabled'))
    }
  }
  const toBind = async (row) => {
    const res = await bind({ op: row.op }).catch(_ => false)
    if (res) {
      const { code, url } = res.data
      window.open(url)
    }
  }
  const toUnBind = async (row) => {
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('UnBind') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) {
      return false
    }
    const res = await unbind({ op: row.op }).catch(_ => false)
    if (res) {
      getMyOauth()
    }
  }

  // Convert administrator-provided Markdown to HTML and sanitize it with DOMPurify to prevent stored XSS.
  const html = computed(_ => DOMPurify.sanitize(marked(appStore.setting.hello||'')))

</script>

<style scoped lang="scss">
.profile-page {
  position: relative;
  margin: 0 auto;
  padding: var(--apple-spacing-6);
  min-height: calc(100vh - 130px);
  border-radius: var(--apple-radius-lg);
  overflow: hidden;
  background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 48%, #ecfeff 100%);
}

html.dark .profile-page {
  background: transparent;
}

/* ========== Glass hero banner ========== */
.profile-hero {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-6);
  padding: 36px 40px;
  border-radius: var(--apple-radius-lg);
  margin-bottom: var(--apple-spacing-6);
  position: relative;
  z-index: 1;
  overflow: hidden;

  // Decorative gradient glow beneath the glass layer.
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(0, 122, 255, 0.15), transparent 70%);
    pointer-events: none;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -5%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(88, 86, 214, 0.10), transparent 70%);
    pointer-events: none;
  }

  .hero-avatar {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    .avatar-ring {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      background: linear-gradient(135deg, #007AFF, #5856D6);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 122, 255, 0.30);
      .avatar-text {
        font-size: 32px;
        font-weight: 700;
        color: #fff;
      }
    }
  }

  .hero-info {
    position: relative;
    z-index: 1;
    flex: 1;
    .hero-name {
      margin: 0 0 6px;
      font-size: var(--apple-font-xl);
      font-weight: 700;
      color: var(--apple-text-primary);
      letter-spacing: -0.3px;
    }
    .hero-email {
      margin: 0 0 8px;
      font-size: var(--apple-font-base);
      color: var(--apple-text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
      .hero-icon {
        width: 16px;
        height: 16px;
        opacity: 0.6;
        flex-shrink: 0;
      }
    }
    .hero-role {
      margin: 0;
    }
  }

  .hero-actions {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  }
}

/* ========== Content grid ========== */
.profile-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--apple-spacing-6);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.profile-col {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-6);
}

/* ========== Glass cards ========== */
.glass-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: var(--apple-radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  padding: var(--apple-spacing-6);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    box-shadow: var(--el-box-shadow-light);
  }
}

html.dark .glass-card {
  background: rgba(44, 44, 46, 0.72);
  border-color: rgba(255, 255, 255, 0.08);
}

/* Card header */
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: var(--apple-spacing-4);
  font-weight: 600;
  font-size: var(--apple-font-md);
  color: var(--apple-text-primary);
  .card-icon {
    width: 20px;
    height: 20px;
    color: var(--apple-blue);
    flex-shrink: 0;
  }
}

/* OIDC list */
.oidc-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.oidc-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--apple-radius-md);
  transition: background 0.2s;
  &:hover {
    background: var(--el-fill-color-light);
  }
}
.oidc-provider {
  display: flex;
  align-items: center;
  gap: 10px;
  .oidc-name {
    font-weight: 500;
    font-size: var(--apple-font-base);
  }
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 0;
  color: var(--apple-gray);
  font-size: var(--apple-font-sm);
}

/* MFA section */
.mfa-body {
  padding-top: 4px;
}
.mfa-status-row {
  display: flex;
  justify-content: center;
}
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 999px;
  background: var(--apple-gray-subtle);
  color: var(--apple-gray);
  font-size: var(--apple-font-sm);
  font-weight: 500;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--apple-gray);
    opacity: 0.6;
  }

  &.active {
    background: var(--apple-green-subtle);
    color: var(--apple-green);
    .status-dot {
      background: var(--apple-green);
      opacity: 1;
      animation: pulse-dot 2s ease-in-out infinite;
    }
  }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}

/* Welcome card */
.welcome-card {
  .welcome-content {
    line-height: 1.7;
    color: var(--el-text-color-regular);
    font-size: var(--apple-font-base);

    :deep(h1), :deep(h2), :deep(h3) {
      color: var(--apple-text-primary);
      margin-top: 0;
    }
    :deep(a) {
      color: var(--apple-blue);
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }
}

/* Dark-mode hero banner adjustments */
html.dark .profile-hero {
  &::before {
    background: radial-gradient(circle, rgba(10, 132, 255, 0.12), transparent 70%);
  }
  &::after {
    background: radial-gradient(circle, rgba(88, 86, 214, 0.08), transparent 70%);
  }
}
</style>

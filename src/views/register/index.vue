<template>
  <div class="login-container">
    <div class="login-card">
      <img src="@/assets/logo.png" alt="logo" class="login-logo"/>
      <el-form ref="f" :model="form" label-position="top" class="login-form" :rules="rules">
        <el-form-item :label="T('Username')" prop="username">
          <el-input v-model="form.username" class="login-input"></el-input>
        </el-form-item>

        <el-form-item :label="T('Email')" prop="email">
          <el-input v-model="form.email" class="login-input"></el-input>
        </el-form-item>

        <el-form-item :label="T('Password')" prop="password">
          <el-input v-model="form.password" type="password" show-password
                    class="login-input"></el-input>
        </el-form-item>
        <el-form-item :label="T('ConfirmPassword')" prop="confirm_password">
          <el-input v-model="form.confirm_password" type="password" @keyup.enter.native="submit" show-password
                    class="login-input"></el-input>
        </el-form-item>
        <el-form-item :label="T('InviteCode')" v-if="showInviteField" :required="inviteOnly">
          <el-input v-if="inviteOnly && !prefilledCode" v-model="form.invite_code" class="login-input" :placeholder="T('InviteCodePlaceholder')" />
          <el-input v-else :model-value="form.invite_code" disabled class="login-input">
            <template #append>
              <el-tag type="success">{{ T('Active') }}</el-tag>
            </template>
          </el-input>
          <div style="margin-top:4px; font-size:12px; color:#909399;">
            {{ T('Administrator') }}：administrator@site.com
          </div>
        </el-form-item>
        <el-form-item label="">
          <el-button @click="submit" class="login-button" type="success">{{ T('Submit') }}</el-button>
          <el-button @click="toLogin" class="login-button">{{ T('ToLogin') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
  import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { T } from '@/utils/i18n'
import { useRoute, useRouter } from 'vue-router'
import { register } from '@/api/user'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const inviteOnly = computed(() => route.query.invite_only === '1')
  const prefilledCode = computed(() => route.query.invite_code || '')
  const showInviteField = computed(() => inviteOnly.value || !!prefilledCode.value)
  const form = reactive({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    invite_code: prefilledCode.value,
  })
  const rules = reactive({
    username: [
      { required: true, message: T('ParamRequired', { param: T('Username') }), trigger: 'blur' },
    ],
    // email: [
    //   { required: true, message: T('ParamRequired', { param: T('Email') }), trigger: 'blur' },
    // ],
    password: [
      { required: true, message: T('ParamRequired', { param: T('Password') }), trigger: 'blur' },
    ],
    confirm_password: [
      { required: true, message: T('ParamRequired', { param: T('ConfirmPassword') }), trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (value !== form.password) {
            callback(new Error(T('PasswordNotMatchConfirmPassword')))
          } else {
            callback()
          }
        }, trigger: 'blur',
      },
    ],
  })
  const f = ref(null)
  const submit = async () => {
    if (inviteOnly.value && !form.invite_code) {
      ElMessage.warning(T('InviteCodeRequired'))
      return
    }
    const v = await f.value.validate().catch(_ => false)
    if (!v) {
      return
    }
    const res = await register(form)
    if (!res || res.code !== 0) {
      if (res && res.message) {
        ElMessage.error(res.message)
      } else {
        ElMessage.error(T('OperationFailed'))
      }
      return
    }
    userStore.saveUserData(res.data)
    useAppStore().loadConfig()
    ElMessage.success(T('RegisterSuccess'))
    router.push('/')
  }
  const toLogin = () => {
    router.push('/login')

  }
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #fbfbfd 0%, #f5f5f7 100%);
}

html.dark .login-container {
  background: #1c1c1e;
}

.login-card {
  width: 380px;
  max-width: 90vw;
  background: #ffffff;
  padding: 44px 36px;
  border-radius: 18px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

html.dark .login-card {
  background: #2c2c2e;
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

h1 {
  margin-bottom: 18px;
  font-size: 26px;
  font-weight: 600;
  color: var(--apple-text-primary);
}

html.dark h1 {
  color: #f5f5f7;
}

.login-form {
  margin-bottom: 8px;
}

.login-input {
  width: 100%;
}

.login-button {
  width: 100%;
  height: 44px;
  margin-bottom: 12px;
  margin-top: 12px;
  margin-left: 0;
  font-weight: 600;
  border-radius: 10px;
}

.login-logo {
  width: 84px;
  height: 84px;
  margin: 0 auto 18px;
  display: block;
}

.el-form-item {
  ::v-deep(.el-form-item__label) {
    color: var(--apple-text-primary);
    font-weight: 500;
  }
}

html.dark .el-form-item {
  ::v-deep(.el-form-item__label) {
    color: #f5f5f7;
  }
}
</style>

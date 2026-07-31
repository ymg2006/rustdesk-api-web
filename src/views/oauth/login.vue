<template>
  <div class="oauth">
    <el-card class="card">
      <h2>{{ T('OauthLogining') }}</h2>
      <el-form class="info">
        <el-form-item :label="T('Device')">
          <div class="impt">{{ oauthInfo.device_name }}</div>
        </el-form-item>
        <el-form-item :label="T('Id')">
          <div class="impt">{{ oauthInfo.id }}</div>
        </el-form-item>
        <el-form-item>
          <el-button style="width: 100%" v-if="!resStatus" type="success" size="large" @click="toConfirm">{{ T('ConfirmOauth') }}</el-button>
        </el-form-item>
        <el-form-item>
          <el-button style="width: 100%" size="large" @click="out">{{ T('Close') }}</el-button>
        </el-form-item>
      </el-form>
      {{ T('OauthCloseNote') }}
    </el-card>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
import { info, confirm } from '@/api/oauth'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { T } from '@/utils/i18n'

  const oauthInfo = ref({})
  const route = useRoute()
  const router = useRouter()
  const code = route.params?.code
  if (!code) {
    // router.push('/')
  }
  const getInfo = async () => {
    const res = await info({ code }).catch(_ => false)
    if (res) {
      oauthInfo.value = res.data
    } else {
      // router.push('/')
    }
  }
  getInfo()
  const resStatus = ref(0)
  const toConfirm = async () => {
    const res = await confirm({ code }).catch(_ => false)
    if (res) {
      resStatus.value = 1
      ElMessage.success(T('OperationSuccessAndCloseAfter3Seconds'))
      setTimeout(_ => {
        out()
      }, 3000)
    }
  }
  const out = () => {
    window.close()
  }

</script>

<style scoped lang="scss">
.oauth {
  width: 100vw;
  min-height: 100vh;
  background: linear-gradient(180deg, #fbfbfd 0%, #f5f5f7 100%);
  padding-top: 25vh;
  box-sizing: border-box;

  .card {
    max-width: 500px;
    margin: 0 auto;
    text-align: center;
    border-radius: 18px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);

    .info {
      display: block;
      line-height: 30px;
      margin-bottom: 50px;

      ::v-deep(.el-form-item__label) {
        color: var(--el-text-color-regular);
      }
    }

    .impt {
      font-weight: 600;
      font-size: 20px;
    }
  }
}
html.dark .oauth {
  background: #1c1c1e;
}
html.dark .oauth .card {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
</style>

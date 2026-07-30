<template>
  <div class="form-card">
    <el-form ref="root" :model="form" :rules="rules">
      <el-form-item :label="T('Username')" prop="username">
        <el-input v-model="form.username"></el-input>
      </el-form-item>
      <el-form-item :label="T('Email')" prop="email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <el-form-item :label="T('Nickname')" prop="nickname">
        <el-input v-model="form.nickname"></el-input>
      </el-form-item>
      <el-form-item :label="T('Group')" prop="group_id">
        <el-tree-select
            v-model="form.group_id"
            :data="groupTreeData"
            :props="{ label: 'name', children: 'children' }"
            value-key="id"
            node-key="id"
            check-strictly
            :render-after-expand="false"
            clearable
            style="width:100%"
        />
      </el-form-item>
      <el-form-item :label="T('Role')" prop="role">
        <el-select v-model="form.role" style="width:100%">
          <el-option :label="T('RegularUser')" value="user" />
          <el-option :label="T('Administrator')" value="admin" />
        </el-select>
      </el-form-item>
      <el-form-item :label="T('Status')" prop="status">
        <el-switch v-model="form.status"
                   :active-value="ENABLE_STATUS"
                   :inactive-value="DISABLE_STATUS"
        ></el-switch>
      </el-form-item>
      <el-form-item :label="T('ExpiredAt')" prop="expiredAtDate">
        <el-date-picker v-model="form.expiredAtDate"
                        type="datetime"
                        value-format="x"
                        :placeholder="T('ExpiredAtPlaceholder')"
                        style="width:100%"/>
        <div style="margin-top:6px; display:flex; gap:4px; flex-wrap:wrap;">
          <el-button size="small" @click="setExpiredAt(30)">1 Month</el-button>
          <el-button size="small" @click="setExpiredAt(90)">3 Months</el-button>
          <el-button size="small" @click="setExpiredAt(365)">1 Year</el-button>
          <el-button size="small" @click="setExpiredAt(3650)">10 Years</el-button>
          <el-button size="small" @click="setExpiredAt(-1)">{{ T('Permanent') }}</el-button>
        </div>
      </el-form-item>
      <el-form-item :label="T('Remark')" prop="remark">
          <el-input v-model="form.remark"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="cancel">{{ T('Cancel') }}</el-button>
        <el-button @click="submit" type="primary">{{ T('Submit') }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGetDetail, useSubmit } from '@/views/user/composables/edit'
import { ENABLE_STATUS, DISABLE_STATUS } from '@/utils/common_options'
import { T } from '@/utils/i18n'

  const route = useRoute()
  const { form, item, getDetail, groupTreeData } = useGetDetail(route.params.id)

  const { root, rules, validate, submit, cancel } = useSubmit(form, route.params.id)

  onMounted(() => {
    // Default role for new users is regular user
    if (!route.params.id || route.params.id == 0) {
      form.value.role = 'user'
    }
  })

  const setExpiredAt = (days) => {
    if (days < 0) {
      form.value.expiredAtDate = null
    } else {
      form.value.expiredAtDate = String(Date.now() + days * 86400000)
    }
  }

</script>

<style lang="scss" scoped>
.form-card {
}
</style>

<template>
  <div>
    <el-card class="list-query query-card" shadow="hover">
      <el-form inline class="filter-form">
        <el-form-item :label="T('Username')">
          <el-input v-model="listQuery.username"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="w-100" @click="handlerQuery">{{ T('Filter') }}</el-button>
        </el-form-item>
        <el-form-item class="filter-form-ex">
          <el-button type="danger" @click="toAdd">{{ T('Add') }}</el-button>
          <el-button type="success" @click="toExport">{{ T('Export') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="list-body" shadow="hover">
      <el-table class="list-table" :data="listRes.list" v-loading="listRes.loading" border>
        <el-table-column prop="id" :label="T('Id')" align="center"></el-table-column>
        <el-table-column prop="username" :label="T('Username')" align="center"/>
        <el-table-column prop="email" :label="T('Email')" align="center"/>
        <el-table-column prop="nickname" :label="T('Nickname')" align="center"/>
        <el-table-column prop="expired_at" :label="T('ExpiredAt')" min-width="170" align="center">
          <template #default="{row}">
            <span v-if="row.expired_at > 0 && row.expired_at * 1000 < Date.now()"
                  style="color: red; font-weight: bold;">{{ formatDate(row.expired_at) }}</span>
            <span v-else-if="row.expired_at > 0">{{ formatDate(row.expired_at) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('Group')" align="center" min-width="125">
          <template #default="{row}">
            <span v-if="row.group_id"> <el-tag>{{ listRes.groups?.find(g => g.id === row.group_id)?.name }} </el-tag> </span>
            <span v-else> - </span>
          </template>
        </el-table-column>
        <el-table-column :label="T('Status')" align="center">
          <template #default="{row}">
            <el-switch v-model="row.status"
                       :active-value="ENABLE_STATUS"
                       :inactive-value="DISABLE_STATUS"
                       @change="changeStatus(row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="T('Remark')" align="center"/>
        <el-table-column prop="created_at" :label="T('CreatedAt')" align="center" min-width="170"/>
        <el-table-column prop="updated_at" :label="T('UpdatedAt')" align="center" min-width="170"/>
        <el-table-column :label="T('Actions')" align="center" width="600" fixed="right">
          <template #default="{row}">
            <el-button @click="toTag(row)" size="small">{{ T('UserTags') }}</el-button>
            <el-button @click="toAddressBook(row)" size="small">{{ T('UserAddressBook') }}</el-button>
            <el-button @click="toEdit(row)" size="small">{{ T('Edit') }}</el-button>
            <el-button type="warning" @click="changePass(row)" size="small">{{ T('ResetPassword') }}</el-button>
            <el-button type="info" @click="resetMfa(row)" size="small">{{ T('MfaReset') }}</el-button>
            <el-button type="danger" @click="remove(row)" size="small">{{ T('Delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card class="list-page" shadow="hover">
      <el-pagination background
                     layout="prev, pager, next, sizes, jumper"
                     :page-sizes="[10,20,50,100]"
                     v-model:page-size="listQuery.page_size"
                     v-model:current-page="listQuery.page"
                     :total="listRes.total">
      </el-pagination>
    </el-card>
  </div>
</template>

<script setup>
  import { useRepositories, useDel, useToEditOrAdd, useChangePwd } from '@/views/user/composables'
import { T } from '@/utils/i18n'
import { DISABLE_STATUS, ENABLE_STATUS } from '@/utils/common_options'
import { update, mfaReset } from '@/api/user'
import { ElMessageBox, ElMessage } from 'element-plus'
import { onMounted, watch } from 'vue'

  const formatDate = (ts) => {
    if (!ts || ts <= 0) return '-'
    const d = new Date(ts * 1000)
    return d.toLocaleString()
  }
  // List
  const {
    listRes,
    listQuery,
    handlerQuery,
    getList,
    getGroups,
    toExport,
  } = useRepositories()

  onMounted(getGroups)

  onMounted(getList)

  watch(() => listQuery.page, getList)
  watch(() => listQuery.page_size, handlerQuery)

  const { toEdit, toAdd, toAddressBook, toTag } = useToEditOrAdd()

  const { changePass } = useChangePwd()

  // Delete
  const { del } = useDel()
  const remove = async (row) => {
    const res = await del(row.id)
    if (res) {
      getList(listQuery)
    }
  }

  const changeStatus = async (row) => {
    /*const confirm = await ElMessageBox.confirm(T('Confirm?', { param: T('Update') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
    }).catch(_ => false)
    if (!confirm) {
      return false
    }*/
    const res = await update(row).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList(listQuery)
    }
  }

  // Admin-forced user MFA reset
  const resetMfa = async (row) => {
    const cf = await ElMessageBox.confirm(
      T('MfaResetConfirm', { username: row.username }),
      T('MfaReset'),
      {
        confirmButtonText: T('Confirm'),
        cancelButtonText: T('Cancel'),
        type: 'warning',
      }
    ).catch(_ => false)
    if (!cf) return
    const res = await mfaReset({ user_id: row.id }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList(listQuery)
    }
  }

</script>

<style scoped>
</style>

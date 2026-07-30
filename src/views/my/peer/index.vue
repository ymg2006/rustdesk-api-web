<template>
  <div>
    <el-card class="list-query" shadow="hover">
      <div style="margin-bottom:12px;">
        <el-button :type="quickFilter === 'all' ? 'primary' : 'default'" size="small" @click="setQuickFilter('all')">{{ T('All') }}</el-button>
        <el-button :type="quickFilter === 'online' ? 'success' : 'default'" size="small" @click="setQuickFilter('online')">{{ T('Online') }}</el-button>
        <el-button :type="quickFilter === 'offline' ? 'danger' : 'default'" size="small" @click="setQuickFilter('offline')">{{ T('Offline') }}</el-button>
      </div>
      <el-form inline>
        <el-form-item :label="T('ID')">
          <el-input v-model="listQuery.id" clearable/>
        </el-form-item>
        <el-form-item :label="T('Hostname')">
          <el-input v-model="listQuery.hostname" clearable/>
        </el-form-item>
        <el-form-item :label="T('LastOnlineTime')">
          <el-select v-model="listQuery.time_ago" clearable>
            <el-option
                v-for="item in timeFilters"
                :key="item.value"
                :label="item.text"
                :value="item.value"
                :disabled="item.value === 0"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
          <el-button type="success" @click="toExport">{{ T('Export') }}</el-button>
          <!--          <el-button type="danger" @click="toBatchDelete">{{ T('BatchDelete') }}</el-button>-->
          <el-button type="primary" @click="toBatchAddToAB">{{ T('BatchAdd') }}</el-button>

        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="list-body" shadow="hover">
      <el-table :data="listRes.list" v-loading="listRes.loading" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" align="center" width="50"/>
        <el-table-column prop="id" :label="T('ID')" align="center" min-width="150">
          <template #default="{row}">
            <span>{{ row.id }} <el-icon @click="handleClipboard(row.id, $event)"><CopyDocument/></el-icon></span>
          </template>
        </el-table-column>
        <el-table-column prop="cpu" :label="T('Cpu')" align="center" min-width="100" show-overflow-tooltip/>
        <el-table-column prop="hostname" :label="T('Hostname')" align="center" min-width="120"/>
        <el-table-column prop="memory" :label="T('Memory')" align="center" min-width="120"/>
        <el-table-column prop="os" :label="T('Os')" align="center" min-width="120" show-overflow-tooltip/>
        <el-table-column prop="last_online_time" :label="T('LastOnlineTime')" align="center" min-width="120">
          <template #default="{row}">
            <div class="last_oline_time">
              <span> {{ row.last_online_time ? timeAgo(row.last_online_time * 1000) : '-' }}</span> <span class="dot" :class="{red: timeDis(row.last_online_time) >= 60, green: timeDis(row.last_online_time)< 60}"></span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="last_online_ip" :label="T('LastOnlineIp')" align="center" min-width="120"/>
        <el-table-column prop="username" :label="T('Username')" align="center" min-width="120"/>
        <el-table-column prop="uuid" :label="T('Uuid')" align="center" min-width="120" show-overflow-tooltip/>
        <el-table-column prop="version" :label="T('Version')" align="center" min-width="80"/>
        <el-table-column prop="alias" :label="T('Alias')" align="center" min-width="80"/>
        <el-table-column prop="created_at" :label="T('CreatedAt')" align="center" min-width="150"/>
        <el-table-column prop="updated_at" :label="T('UpdatedAt')" align="center" min-width="150"/>
        <el-table-column :label="T('Actions')" align="center" width="400" fixed="right">
          <template #default="{row}">
            <el-button type="success" @click="connectByClient(row.id)" size="small">{{ T('Link') }}</el-button>
            <el-button v-if="appStore.setting.appConfig.web_client" type="success" @click="toWebClientLink(row)" size="small">
              {{ T('WebClient') }}
            </el-button>
            <el-button type="primary" @click="toAddressBook(row)" size="small">{{ T('AddToAddressBook') }}</el-button>
            <el-button @click="toView(row)" size="small">{{ T('View') }}</el-button>
            <!--            <el-button type="danger" @click="del(row)">{{ T('Delete') }}</el-button>-->
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
    <el-dialog v-model="formVisible" :title="T('Information')" width="800" :style="{ textAlign: 'center' }" append-to-body>
      <el-form class="dialog-form" ref="form" :model="formData">
        <el-form-item :label="T('ID')" prop="id">
          <el-input v-model="formData.id" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Username')" prop="username">
          <el-input v-model="formData.username" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Hostname')" prop="hostname">
          <el-input v-model="formData.hostname" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Cpu')" prop="cpu">
          <el-input v-model="formData.cpu" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Memory')" prop="memory">
          <el-input v-model="formData.memory" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Os')" prop="os">
          <el-input v-model="formData.os" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Uuid')" prop="uuid">
          <el-input v-model="formData.uuid" disabled></el-input>
        </el-form-item>
        <el-form-item :label="T('Version')" prop="version">
          <el-input v-model="formData.version" disabled></el-input>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog v-model="ABFormVisible" width="800" :title="T('Create')" append-to-body>
      <el-form class="dialog-form" ref="form" :model="ABFormData">
        <el-form-item :label="T('AddressBookName')" required prop="collection_id">
          <el-select v-model="ABFormData.collection_id" clearable @change="changeCollectionForUpdate">
            <el-option :value="0" :label="T('MyAddressBook')"></el-option>
            <el-option v-for="c in collectionListResForUpdate.list" :key="c.id" :label="c.name" :value="c.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('ID')" prop="id" required>
          <el-input v-model="ABFormData.id"></el-input>
        </el-form-item>
        <el-form-item :label="T('Username')" prop="username">
          <el-input v-model="ABFormData.username"></el-input>
        </el-form-item>
        <el-form-item :label="T('Alias')" prop="alias">
          <el-input v-model="ABFormData.alias"></el-input>
        </el-form-item>
        <el-form-item :label="T('Hostname')" prop="hostname">
          <el-input v-model="ABFormData.hostname"></el-input>
        </el-form-item>
        <el-form-item :label="T('Platform')" prop="platform">
          <el-select v-model="ABFormData.platform">
            <el-option
                v-for="item in ABPlatformList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="T('Tags')" prop="tags">
          <el-select v-model="ABFormData.tags" multiple>
            <el-option
                v-for="item in tagListRes.list"
                :key="item.name"
                :label="item.name"
                :value="item.name"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="ABFormVisible = false">{{ T('Cancel') }}</el-button>
          <el-button @click="ABSubmit" type="primary">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog v-model="batchABFormVisible" width="800" :title="T('Create')" append-to-body>
      <el-form class="dialog-form" ref="form" :model="batchABFormData">
        <el-form-item :label="T('AddressBookName')" required prop="collection_id">
          <el-select v-model="batchABFormData.collection_id" clearable @change="changeCollectionForBatchCreateAB">
            <el-option :value="0" :label="T('MyAddressBook')"></el-option>
            <el-option v-for="c in collectionListResForUpdate.list" :key="c.id" :label="c.name" :value="c.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('Tags')" prop="tags">
          <el-select v-model="batchABFormData.tags" multiple>
            <el-option
                v-for="item in tagListRes.list"
                :key="item.name"
                :label="item.name"
                :value="item.name"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="batchABFormVisible = false">{{ T('Cancel') }}</el-button>
          <el-button @click="submitBatchAddToAB" type="primary">{{ T('Submit') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
  import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { list } from '@/api/my/peer'
import { ElMessage } from 'element-plus'
import { toWebClientLink } from '@/utils/webclient'
import { T } from '@/utils/i18n'
import { timeAgo } from '@/utils/time'
import { jsonToCsv, downBlob } from '@/utils/file'
import { useRepositories as useABRepositories } from '@/views/address_book/index'
import { useAppStore } from '@/store/app'
import { connectByClient } from '@/utils/peer'
import { CopyDocument } from '@element-plus/icons'
import { handleClipboard } from '@/utils/clipboard'
import { batchCreateFromPeers } from '@/api/my/address_book'

  const appStore = useAppStore()
  const route = useRoute()

  const quickFilter = ref('all')

  function setQuickFilter(v) {
    quickFilter.value = v
    if (v === 'all') {
      listQuery.time_ago = null
    } else if (v === 'online') {
      listQuery.time_ago = -300
    } else if (v === 'offline') {
      listQuery.time_ago = 300
    }
    handlerQuery()
  }

  const listRes = reactive({
    list: [], total: 0, loading: false,
  })
  const listQuery = reactive({
    page: 1,
    page_size: 10,
    time_ago: null,
    id: '',
    hostname: '',
  })

  const getList = async () => {
    listRes.loading = true
    const res = await list(listQuery).catch(_ => false)
    listRes.loading = false
    if (res) {
      listRes.list = res.data.list
      listRes.total = res.data.total
    }
  }
  const handlerQuery = () => {
    if (listQuery.page === 1) {
      getList()
    } else {
      listQuery.page = 1
    }
  }

  // Apply time_ago filter from home-page navigation on first entry (must run after listQuery / handlerQuery to avoid TDZ crashes)
  if (route.query.time_ago) {
    const ta = Number(route.query.time_ago)
    if (ta < 0) { setQuickFilter('online'); listQuery.time_ago = ta }
    else if (ta > 0) { setQuickFilter('offline'); listQuery.time_ago = ta }
  }

  /*const del = async (row) => {
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Delete') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) {
      return false
    }

    const res = await remove({ row_id: row.row_id }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList()
    }
  }*/
  onMounted(() => {
    // Query filtering is handled at the end of setup; load all here only when there is no query
    if (route.query.time_ago == null) getList()
  })
  onActivated(() => {
    if (route.query.time_ago == null) getList()
  })

  watch(() => listQuery.page, getList)

  watch(() => listQuery.page_size, handlerQuery)

  const formVisible = ref(false)
  const formData = reactive({
    row_id: 0,
    cpu: '',
    hostname: '',
    id: '',
    memory: '',
    os: '',
    username: '',
    uuid: '',
    version: '',
  })

  const toView = (row) => {
    formVisible.value = true
    // Copy row data into formData
    Object.keys(formData).forEach(key => {
      formData[key] = row[key]
    })
  }

  const timeDis = (time) => {
    let now = new Date().getTime()
    let after = new Date(time * 1000).getTime()
    return (now - after) / 1000
  }

  const timeFilters = computed(() => [
    { text: T('MinutesLess', { param: 1 }, 1), value: -60 },
    { text: T('HoursLess', { param: 1 }, 1), value: -3600 },
    { text: T('DaysLess', { param: 1 }, 1), value: -86400 },
    { text: '---------', value: 0 },
    { text: T('MinutesAgo', { param: 1 }, 1), value: 60 },
    { text: T('HoursAgo', { param: 1 }, 1), value: 3600 },
    { text: T('DaysAgo', { param: 1 }, 1), value: 86400 },
    { text: T('MonthsAgo', { param: 1 }, 1), value: 2592000 },
    // { text: T('YearsAgo', { param: 1 }, 1), value: 31536000 },
  ])

  const toExport = async () => {
    const q = { ...listQuery }
    q.page_size = 10000
    q.page = 1
    const res = await list(q).catch(_ => false)
    if (res) {
      const data = res.data.list.map(item => {
        item.last_online_time = item.last_online_time ? new Date(item.last_online_time * 1000).toLocaleString() : '-'
        delete item.user_id
        delete item.user
        return item
      })
      const csv = jsonToCsv(data)
      downBlob(csv, 'peers.csv')
    }
  }

  const {
    platformList: ABPlatformList,
    formVisible: ABFormVisible,
    formData: ABFormData,
    collectionListResForUpdate,
    getCollectionListForUpdate,
    tagListRes,
    changeCollectionForUpdate,
    submit: ABSubmit,
    fromPeer,
  } = useABRepositories('my')
  onMounted(getCollectionListForUpdate)
  const toAddressBook = (peer) => {
    fromPeer(peer)
    ABFormVisible.value = true
  }

  const multipleSelection = ref([])
  const handleSelectionChange = (val) => {
    multipleSelection.value = val
  }
  /*const toBatchDelete = async () => {
    if (!multipleSelection.value.length) {
      ElMessage.warning(T('PleaseSelectData'))
      return false
    }
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('BatchDelete') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) {
      return false
    }

    const res = await batchRemove({ row_ids: multipleSelection.value.map(i => i.row_id) }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      getList()
    }
  }*/

  const batchABFormVisible = ref(false)
  const toBatchAddToAB = () => {
    batchABFormVisible.value = true
  }
  const batchABFormData = ref({
    collection_id: 0,
    tags: [],
    peer_ids: [],
  })
  const changeCollectionForBatchCreateAB = (val) => {
    batchABFormData.value.tags = []
    changeCollectionForUpdate(val)
  }
  const submitBatchAddToAB = async () => {
    if (multipleSelection.value.length === 0) {
      ElMessage.warning(T('PleaseSelectData'))
      return false
    }
    batchABFormData.value.peer_ids = multipleSelection.value.map(i => i.row_id)
    if (!batchABFormData.value.peer_ids.length) {
      ElMessage.warning(T('PleaseSelectData'))
      return false
    }

    const res = await batchCreateFromPeers(batchABFormData.value).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      batchABFormVisible.value = false
    }
  }


</script>

<style scoped lang="scss">
.list-query .el-select {
  --el-select-width: 180px;
}

.last_oline_time {
  display: flex;
  justify-content: center;
  align-items: center;
}

.dot {
  width: 6px;
  height: 6px;
  display: block;
  border-radius: 50%;
  margin-left: 10px;

  &.red {
    background-color: red;
  }

  &.green {
    background-color: green;
  }
}
</style>

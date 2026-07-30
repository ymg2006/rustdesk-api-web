<template>
  <div>
    <el-card shadow="hover">
      <div class="toolbar">
        <span class="tip">{{ T('ServerStatusTip') }}</span>
        <el-switch v-model="autoRefresh" :active-text="T('AutoRefresh')" />
        <el-button type="primary" @click="openCreate">{{ T('AddServer') }}</el-button>
        <el-button type="primary" @click="load" :loading="loading">{{ T('Refresh') }}</el-button>
      </div>
    </el-card>

    <el-card shadow="hover" class="list-card">
      <el-table :data="servers" size="default" v-loading="loading" empty-text=" ">
        <el-table-column :label="T('ServerName')" min-width="160">
          <template #default="{ row }">
            <b>{{ row.name }}</b>
          </template>
        </el-table-column>
        <el-table-column :label="T('ServerAddress')" min-width="220">
          <template #default="{ row }">
            <span class="addr">{{ row.addr }}</span>
            <el-tag v-if="row.protocol && row.protocol !== 'tcp'" size="small" type="info" style="margin-left:6px">
              {{ row.protocol }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="T('Status')" min-width="160">
          <template #default="{ row }">
            <el-tag :type="tagType(row.status)" effect="dark">{{ statusText(row.status) }}</el-tag>
            <span v-if="row.status === 'up'" class="latency">{{ row.latency_ms }} ms</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('ServerError')" min-width="200">
          <template #default="{ row }">
            <span v-if="row.status !== 'up'" class="err">{{ row.error || '-' }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('Actions')" align="center" width="200" fixed="right">
          <template #default="{ row }">
            <el-button @click="openEdit(row)" size="small">{{ T('Edit') }}</el-button>
            <el-button type="danger" @click="remove(row)" size="small">{{ T('Delete') }}</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty">
            <span>{{ T('NoServer') }}</span>
            <el-button type="primary" size="small" @click="openCreate">{{ T('AddServer') }}</el-button>
          </div>
        </template>
      </el-table>
    </el-card>

    <!-- HBBR load / connections (available only when api-server and hbbr share a host) -->
    <el-card shadow="hover" class="stats-card" v-if="hbbrStats">
      <template #header>
        <div class="card-header">
          <b>{{ T('HbbrLoad') }}</b>
          <span>{{ hbbrStats.host }}</span>
        </div>
      </template>

      <el-alert
        v-if="!hbbrStats.available"
        :title="T('HbbrStatsUnavailable')"
        type="warning"
        :description="hbbrStats.error || ''"
        :closable="false"
        show-icon
        style="margin-bottom:16px"
      />

      <template v-else>
        <el-row :gutter="20" class="metrics">
          <el-col :span="6">
            <div class="metric">
              <div class="metric-value">{{ hbbrStats.connection_count }}</div>
              <div class="metric-label">{{ T('ConnectionCount') }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric">
              <div class="metric-value">{{ fmtKbps(hbbrStats.current_speed_kbps) }}</div>
              <div class="metric-label">{{ T('CurrentSpeed') }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric">
              <div class="metric-value">{{ fmtKbps(hbbrStats.highest_speed_kbps) }}</div>
              <div class="metric-label">{{ T('HighestSpeed') }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric">
              <div class="metric-value">{{ fmtMB(hbbrStats.total_traffic_mb) }}</div>
              <div class="metric-label">{{ T('TotalTraffic') }}</div>
            </div>
          </el-col>
        </el-row>

        <el-table :data="hbbrStats.connections || []" class="conn-table" max-height="320">
          <el-table-column prop="ip" :label="T('ClientAddr')" min-width="160" />
          <el-table-column :label="T('Duration')" min-width="110">
            <template #default="{ row }">{{ row.seconds }}s</template>
          </el-table-column>
          <el-table-column :label="T('Traffic')" min-width="120">
            <template #default="{ row }">{{ fmtMB(row.traffic_mb) }}</template>
          </el-table-column>
          <el-table-column :label="T('HighestSpeed')" min-width="130">
            <template #default="{ row }">{{ fmtKbps(row.highest_kbps) }}</template>
          </el-table-column>
          <el-table-column :label="T('AvgSpeed')" min-width="120">
            <template #default="{ row }">{{ fmtKbps(row.avg_kbps) }}</template>
          </el-table-column>
          <el-table-column :label="T('CurrentSpeed')" min-width="130">
            <template #default="{ row }">{{ fmtKbps(row.speed_kbps) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>

    <!-- Add/edit dialog -->
    <el-dialog v-model="dialogVisible" :title="editing ? T('EditServer') : T('AddServer')" width="480px">
      <el-form :model="form">
        <el-form-item :label="T('ServerName')">
          <el-input v-model="form.name" :placeholder="T('ServerNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="T('ServerHost')">
          <el-input v-model="form.host" :placeholder="T('ServerHostPlaceholder')" />
        </el-form-item>
        <el-form-item :label="T('ServerPort')">
          <el-input v-model.number="form.port" type="number" :placeholder="T('ServerPortPlaceholder')" />
        </el-form-item>
        <el-form-item :label="T('Enabled')">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ T('Cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="save">{{ T('Save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
import {
    serverStatus,
    serverStatusCreate,
    serverStatusUpdate,
    serverStatusDelete,
} from '@/api/serverStatus'
import { T } from '@/utils/i18n'
import { ElMessage, ElMessageBox } from 'element-plus'

  const servers = ref([])
  const hbbrStats = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const autoRefresh = ref(true)
  const dialogVisible = ref(false)
  const editing = ref(false)
  const form = ref({ row_id: 0, name: '', host: '', port: 0, enabled: 1 })
  let timer = null

  const tagType = (status) => {
    if (status === 'up') return 'success'
    if (status === 'down') return 'danger'
    return 'info'
  }
  const statusText = (status) => {
    if (status === 'up') return T('ServerUp')
    if (status === 'down') return T('ServerDown')
    return T('ServerNotConfigured')
  }
  const fmtKbps = (v) => {
    const n = Number(v) || 0
    if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' Gb/s'
    if (n >= 1024) return (n / 1024).toFixed(2) + ' Mb/s'
    return n + ' kb/s'
  }
  const fmtMB = (v) => {
    const n = Number(v) || 0
    if (n >= 1024) return (n / 1024).toFixed(2) + ' GB'
    return n.toFixed(2) + ' MB'
  }

  const load = async () => {
    loading.value = true
    const res = await serverStatus().catch(e => {
      ElMessage.error(e?.message || T('OperationFailed'))
      return false
    })
    loading.value = false
    if (res) {
      servers.value = res.data.list || []
      hbbrStats.value = res.data.hbbr_stats
    }
  }

  const openCreate = () => {
    editing.value = false
    form.value = { row_id: 0, name: '', host: '', port: 0, enabled: 1 }
    dialogVisible.value = true
  }
  const openEdit = (row) => {
    editing.value = true
    form.value = {
      row_id: row.row_id,
      name: row.name,
      host: row.host,
      port: row.port,
      enabled: 1,
    }
    dialogVisible.value = true
  }
  const save = async () => {
    if (!form.value.name || !form.value.host) {
      ElMessage.warning(T('ServerNameHostRequired'))
      return
    }
    saving.value = true
    const data = { ...form.value }
    const api = editing.value ? serverStatusUpdate : serverStatusCreate
    const res = await api(data).catch(e => {
      ElMessage.error(e?.message || T('OperationFailed'))
      return false
    })
    saving.value = false
    if (res) {
      ElMessage.success(T('Saved'))
      dialogVisible.value = false
      load()
    }
  }
  const remove = (row) => {
    ElMessageBox.confirm(T('ConfirmDeleteServer'), T('Hint'), {
      type: 'warning',
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
    }).then(async () => {
      const res = await serverStatusDelete(row.row_id).catch(e => {
        ElMessage.error(e?.message || T('OperationFailed'))
        return false
      })
      if (res) {
        ElMessage.success(T('Deleted'))
        load()
      }
    }).catch(() => {})
  }

  onMounted(() => {
    load()
    timer = setInterval(() => {
      if (autoRefresh.value) load()
    }, 10000)
  })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  .tip {
    flex: 1;
    color: #888;
    font-size: 13px;
  }
}
.list-card {
  margin-top: 20px;
}
.stats-card {
  margin-top: 20px;
}
.addr {
  font-family: monospace;
}
.latency {
  margin-left: 8px;
  color: var(--apple-green);
  font-size: 13px;
}
.err {
  color: #f56c6c;
  font-size: 13px;
  word-break: break-all;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--apple-gray);
  padding: 20px 0;
}
.card-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  span {
    font-size: 12px;
    color: #999;
    font-weight: normal;
  }
}
.metrics {
  margin-bottom: 16px;
}
.metric {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 14px 10px;
  text-align: center;
  .metric-value {
    font-size: 22px;
    font-weight: 600;
    color: #303133;
  }
  .metric-label {
    margin-top: 6px;
    font-size: 12px;
    color: var(--apple-gray);
  }
}
.conn-table {
  margin-top: 4px;
}
</style>

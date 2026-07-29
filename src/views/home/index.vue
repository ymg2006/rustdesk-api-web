<template>
  <div style="position: relative;">
    <!-- Refresh interval indicator -->
    <div class="auto-refresh-timer">
      <div class="countdown-circle">
        <el-progress
          type="circle"
          :percentage="refreshPercentage"
          :width="35"
          :stroke-width="4"
          :show-text="false"
        />

        <span class="countdown-number">
          {{ refreshSeconds }}
        </span>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" style="cursor:pointer" @click="goPeer('all')">
          <div class="stat-item">
            <div class="num">{{ stats.total_peers }}</div>
            <div class="label">{{ T('TotalDevices') }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" style="cursor:pointer" @click="goPeer('online')">
          <div class="stat-item">
            <div class="num green">{{ stats.online_peers }}</div>
            <div class="label">{{ T('Online') }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" style="cursor:pointer" @click="goPeer('offline')">
          <div class="stat-item">
            <div class="num gray">{{ stats.offline_peers }}</div>
            <div class="label">{{ T('Offline') }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" :style="isAdmin ? 'cursor:pointer' : ''" @click="goConnLog">
          <div class="stat-item">
            <div class="num blue">{{ stats.today_connections }}</div>
            <div class="label">{{ T('TodayConnections') }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>{{ T('RecentDevices') }}</span>
          </template>
          <el-table :data="recentPeers" v-loading="loading" height="300">
            <el-table-column prop="hostname" :label="T('Hostname')" min-width="90">
              <template #default="{row}">
                <el-tag type="danger" size="small" effect="plain">{{ row.hostname || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="alias" :label="T('Alias')" min-width="80">
              <template #default="{row}">{{ row.alias || '-' }}</template>
            </el-table-column>
            <el-table-column label="Tags" min-width="120">
              <template #default="{row}">
                <el-tag v-for="t in (row.tags || [])" :key="t" size="small" style="margin-right: 4px; margin-bottom: 2px;">{{ t }}</el-tag>
                <span v-if="!row.tags || row.tags.length === 0" style="color: var(--apple-border);">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="last_online_time" :label="T('LastOnline')" min-width="150">
              <template #default="{row}">
                <span v-if="row.last_online_time">{{ formatTime(row.last_online_time) }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>{{ T('RecentConnections') }}</span>
          </template>
          <el-table :data="recentLogs" v-loading="loadingLogs" height="300">
            <el-table-column prop="from_name" :label="T('Username')" min-width="90"></el-table-column>
            <el-table-column prop="peer_hostname" label="Hostname" min-width="100">
              <template #default="{row}">{{ row.peer_hostname || row.peer_id?.substring(0,12) || '-' }}</template>
            </el-table-column>
            <el-table-column prop="peer_alias" :label="T('Alias')" min-width="80">
              <template #default="{row}">{{ row.peer_alias || '-' }}</template>
            </el-table-column>
            <el-table-column label="Connection Time" min-width="150">
              <template #default="{row}">{{ row.created_at }}</template>
            </el-table-column>
            <el-table-column label="End Time" min-width="150">
              <template #default="{row}">
                <span v-if="row.close_time_str">{{ row.close_time_str }}</span>
                <el-tag v-else type="success" size="small">In Progress</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <span>{{ T('StationMessages') }}</span>
            <el-tag v-if="unreadMsgCount > 0" type="danger" size="small" style="margin-left:8px">
              {{ unreadMsgCount }} {{ T('Unread') }}
            </el-tag>
            <el-button text size="small" style="float:right" @click="markAllRead" :disabled="unreadMsgCount===0">
              {{ T('MarkAllRead') }}
            </el-button>
          </template>
          <el-table :data="recentMessages" v-loading="loadingMsg" max-height="250">
            <el-table-column prop="sender_name" :label="T('Sender')" min-width="120">
              <template #default="{row}">
                <el-tag v-if="row.type==='broadcast'" type="danger" size="small">All</el-tag>
                <span v-else>{{ row.sender_name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="title" :label="T('MessageTitle')" min-width="120">
              <template #default="{row}">
                <span :style="row.is_read ? '' : 'font-weight:bold'">{{ row.title || row.content }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="T('Time')" min-width="160">
              <template #default="{row}">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="Actions" min-width="80">
              <template #default="{row}">
                <el-button v-if="!row.is_read" text size="small" @click="markRead(row.row_id)">
                  {{ T('MarkRead') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="totalMessages > 5" style="text-align:center;margin-top:8px">
            <router-link to="/stationMessages">{{ T('ViewAll') }} ({{ totalMessages }})</router-link>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <!-- Version info -->
    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: var(--apple-gray);">
      {{ T('Backend') }}: {{ backendVersion }}
    </div>
  </div>
</template>

<script setup>
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { T } from '@/utils/i18n'
import request from '@/utils/request'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const isAdmin = computed(() => userStore.route_names?.includes('*'))

const stats = ref({ total_peers: 0, online_peers: 0, offline_peers: 0, total_users: 0, today_connections: 0 })
const backendVersion = ref('')
const recentPeers = ref([])
const loading = ref(false)
const recentLogs = ref([])
const loadingLogs = ref(false)
const now = ref(Math.floor(Date.now() / 1000))
const recentMessages = ref([])
const loadingMsg = ref(false)
const unreadMsgCount = ref(0)
const totalMessages = ref(0)

const AUTO_REFRESH_SECONDS = 30
const refreshSeconds = ref(AUTO_REFRESH_SECONDS)
const isAutoRefreshing = ref(false)
let autoRefreshTimer

const refreshPercentage = computed(() => {
  return (refreshSeconds.value / AUTO_REFRESH_SECONDS) * 100
})

const fetchStats = async () => {
  const res = await request({ url: '/dashboard/stats' }).catch(_ => false)
  if (res) stats.value = res.data
}

const fetchRecentPeers = async () => {
  loading.value = true
  const isAdmin = useUserStore().route_names?.includes('*')
  const url = isAdmin ? '/peer/list' : '/my/peer/list'
  const res = await request({ url, params: { page: 1, page_size: 50, time_ago: 300 } }).catch(_ => false)
  loading.value = false
  if (res) {
    // Recently offline devices: sort by last online time descending and keep the top 10 from the last month
    const monthAgo = now.value - 2592000
    recentPeers.value = (res.data.list || [])
      .filter(p => p.last_online_time > monthAgo)
      .sort((a, b) => b.last_online_time - a.last_online_time)
      .slice(0, 10)
  }
}

const fetchRecentLogs = async () => {
  loadingLogs.value = true
  const isAdmin = useUserStore().route_names?.includes('*')
  const url = isAdmin ? '/audit_conn/list' : '/my/audit_conn/list'
  const res = await request({ url, params: { page: 1, page_size: 10 } }).catch(_ => false)
  loadingLogs.value = false
  if (res) {
    recentLogs.value = res.data.list.map(r => ({
      from_name: r.from_name || r.from_peer || '-',
      peer_id: r.peer_id,
      peer_hostname: r.peer_hostname,
      peer_alias: r.peer_alias,
      type: r.type,
      created_at: r.created_at,
      close_time: r.close_time,
      close_time_str: r.close_time_str,
    }))
  }
}

const fetchMessages = async () => {
  loadingMsg.value = true
  const [msgRes, countRes] = await Promise.all([
    request({ url: '/station_message/list', params: { page: 1, page_size: 5, is_read: 0 } }).catch(_ => false),
    request({ url: '/station_message/unread_count' }).catch(_ => false),
  ])
  loadingMsg.value = false
  if (msgRes) {
    recentMessages.value = msgRes.data.list || []
    totalMessages.value = msgRes.data.total || 0
  }
  if (countRes) {
    unreadMsgCount.value = countRes.data.count || 0
  }
}

const markRead = async (id) => {
  await request({ url: '/station_message/mark_read', method: 'post', data: { id } }).catch(_ => false)
  fetchMessages()
}

const markAllRead = async () => {
  await request({ url: '/station_message/mark_read', method: 'post', data: { all: true } }).catch(_ => false)
  fetchMessages()
}

function goPeer(status) {
  const routeName = isAdmin.value ? 'Peer' : 'MyPeer'
  let timeAgo = 0
  if (status === 'online') timeAgo = -300
  else if (status === 'offline') timeAgo = 300
  router.push({ name: routeName, query: { time_ago: timeAgo } })
}

function goConnLog() {
  if (!isAdmin.value) return
  router.push({ name: 'AuditConn' })
}

const formatTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fetchVersion = async () => {
  const res = await request({ url: '/server/info' }).catch(_ => false)
  if (res) backendVersion.value = res.data.backend_version || ''
}

const refreshPollingData = async () => {
  if (isAutoRefreshing.value) return

  isAutoRefreshing.value = true
  now.value = Math.floor(Date.now() / 1000)

  try {
    await Promise.all([
      fetchStats(),
      fetchRecentPeers(),
      fetchMessages(),
    ])
  } finally {
    refreshSeconds.value = AUTO_REFRESH_SECONDS
    isAutoRefreshing.value = false
  }
}

let isInitialized = false

const stopAutoRefreshTimer = () => {
  if (autoRefreshTimer !== undefined) {
    window.clearInterval(autoRefreshTimer)
    autoRefreshTimer = undefined
  }
}

const startAutoRefreshTimer = () => {
  stopAutoRefreshTimer()

  autoRefreshTimer = window.setInterval(() => {
    if (isAutoRefreshing.value) return

    if (refreshSeconds.value > 1) {
      refreshSeconds.value -= 1
      return
    }

    refreshSeconds.value = 0
    void refreshPollingData()
  }, 1000)
}

onMounted(async () => {
  now.value = Math.floor(Date.now() / 1000)

  await Promise.all([
    fetchVersion(),
    fetchStats(),
    fetchRecentPeers(),
    fetchRecentLogs(),
    fetchMessages(),
  ])

  refreshSeconds.value = AUTO_REFRESH_SECONDS
  isInitialized = true
  startAutoRefreshTimer()
})

onActivated(() => {
  if (!isInitialized) return

  refreshSeconds.value = AUTO_REFRESH_SECONDS
  startAutoRefreshTimer()
})

onDeactivated(() => {
  stopAutoRefreshTimer()
})

onUnmounted(() => {
  stopAutoRefreshTimer()
})
</script>

<style scoped lang="scss">
.auto-refresh-timer {
  position: fixed;
  top: 50px;
  right: 20px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--apple-gray);
}

.countdown-circle {
  position: relative;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  isolation: isolate;

  &::before {
    content: '';
    position: absolute;
    inset: 5px;
    z-index: 0;
    border-radius: 50%;

    box-shadow:
      inset 0 0 6px color-mix(
        in srgb,
        var(--el-color-primary) 12%,
        transparent
      ),
      0 0 4px color-mix(
        in srgb,
        var(--el-color-primary) 8%,
        transparent
      );
  }

  > .el-progress {
    position: relative;
    z-index: 1;
  }
}

.countdown-number {
  position: absolute;
  inset: 0;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

.stat-item {
  text-align: center;
  padding: 10px 0;
  .num {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 8px;
    &.green { color: var(--apple-green); }
    &.gray { color: var(--apple-gray); }
    &.blue { color: var(--apple-blue); }
  }
  .label { font-size: var(--apple-font-base); color: var(--apple-gray); }
}
</style>

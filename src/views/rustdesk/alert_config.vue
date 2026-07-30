<template>
  <div>
    <!-- Notification-channel management -->
    <el-card shadow="hover" style="margin-bottom:20px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>{{ T('AlertChannel') }}</span>
          <el-button type="primary" size="small" @click="showChannelForm()">{{ T('Add') }}</el-button>
        </div>
      </template>
      <el-table :data="channels" v-loading="loadingCh" border>
        <el-table-column prop="name" :label="T('Name')" min-width="120"></el-table-column>
        <el-table-column prop="channel" :label="T('Type')" min-width="100" align="center">
          <template #default="{row}">
            <el-tag :type="channelType(row.channel)" size="small">{{ channelLabel(row.channel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="T('AlertConfigSummary')" min-width="200">
          <template #default="{row}">
            <span v-if="row.channel==='smtp'" style="font-size:12px;color:#666">{{ row.smtp_user }} (recipients are specified in the rule)</span>
            <span v-else-if="row.webhook_url" style="font-size:12px;color:#666">{{ row.webhook_url.slice(0,60) }}...</span>
            <span v-else style="color:var(--apple-gray)">-</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('CreatedAt')" min-width="160">
          <template #default="{row}">{{ row.created_at || '-' }}</template>
        </el-table-column>
        <el-table-column :label="T('Actions')" min-width="220" align="center">
          <template #default="{row}">
            <el-button size="small" @click="showChannelForm(row)">{{ T('Edit') }}</el-button>
            <el-button size="small" @click="testChannel(row)">{{ T('Test') }}</el-button>
            <el-button size="small" type="danger" @click="delChannel(row)">{{ T('Delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Channel form -->
    <el-dialog v-model="chFormVisible" :title="chEditId ? T('Edit') : T('Add')" width="600px" append-to-body>
      <el-form>
        <el-form-item :label="T('Name')">
          <el-input v-model="chForm.name" :placeholder="T('AlertChannelNamePlaceholder')"></el-input>
        </el-form-item>
        <el-form-item :label="T('Type')">
          <el-select v-model="chForm.channel" style="width:100%">
            <el-option :label="channelLabel('station')" value="station"></el-option>
            <el-option :label="channelLabel('wecom')" value="wecom"></el-option>
            <el-option :label="channelLabel('dingtalk')" value="dingtalk"></el-option>
            <el-option :label="channelLabel('smtp')" value="smtp"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="chForm.channel==='wecom'||chForm.channel==='dingtalk'" :label="T('WebhookUrl')">
          <el-input v-model="chForm.webhook_url" placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"></el-input>
        </el-form-item>
        <template v-if="chForm.channel==='smtp'">
          <el-form-item :label="T('SmtpHost')">
            <el-input v-model="chForm.smtp_host" placeholder="smtp.qq.com"></el-input>
          </el-form-item>
          <el-form-item :label="T('SmtpPort')">
            <el-input-number v-model="chForm.smtp_port" :min="1" :max="65535"></el-input-number>
          </el-form-item>
          <el-form-item :label="T('SmtpUser')">
            <el-input v-model="chForm.smtp_user" placeholder="xxx@qq.com"></el-input>
          </el-form-item>
          <el-form-item :label="T('SmtpPass')">
            <el-input v-model="chForm.smtp_pass" type="password" :placeholder="chEditId ? T('LeaveBlankUnchanged') : T('Required')"></el-input>
          </el-form-item>
          <el-alert type="info" :closable="false" show-icon style="margin-bottom:8px"
            :title="T('AlertChannelSmtpTip')" />
        </template>
        <el-form-item>
          <el-button type="primary" @click="submitChannel">{{ T('Submit') }}</el-button>
          <el-button @click="testChannelForm">{{ T('SendTest') }}</el-button>
          <el-button @click="chFormVisible=false">{{ T('Cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- Alert-rule list -->
    <el-card shadow="hover">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>{{ T('AlertConfig') }}</span>
          <el-button type="primary" size="small" @click="showRuleForm()">{{ T('Add') }}</el-button>
        </div>
      </template>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">
        <template #title>{{ T('OfflineAlertLogic') }}</template>
        <template #description>
          <ul style="margin:4px 0 0;padding-left:18px;line-height:1.7;font-size:12px">
            <li>{{ T('DeviceCheckedEveryFiveMinutes') }}</li>
            <li>{{ T('OfflineThresholdWeightTip') }}</li>
            <li>{{ T('AlertWeightResetsDaily') }}</li>
            <li>{{ T('MaxThreeAlertsPerDay') }}</li>
            <li>{{ T('AlertsPauseAfterThreeDays') }}</li>
          </ul>
        </template>
      </el-alert>
      <el-table :data="configs" v-loading="loading" border>
        <el-table-column prop="name" :label="T('Name')" min-width="100"></el-table-column>
        <el-table-column :label="T('AlertChannel')" min-width="120">
          <template #default="{row}">
            <div style="display:flex;flex-direction:row;align-items:center;gap:8px;">
              <el-tag :type="channelType(row.channel)" size="small">{{ channelLabel(row.channel) }}</el-tag>
              <div style="font-size:11px;color:var(--apple-gray)">{{ row.name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="T('SmtpTo')" min-width="180">
          <template #default="{row}">
            <span style="font-size:12px">{{ getRecipient(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('MonitorScope')" min-width="180">
          <template #default="{row}">
            <span v-if="row.monitor_all===1">{{ T('AllDevices') }}</span>
            <span v-else>
              <el-tag size="small" type="info" style="margin-right:4px" v-for="t in (row.targets||[])" :key="t.row_id">
                {{ t.target_name || t.target_id }}
              </el-tag>
              <span v-if="!row.targets||row.targets.length===0" style="color:var(--apple-gray)">{{ T('ServerNotConfigured') }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="T('OfflineMin')" min-width="80" align="center">
          <template #default="{row}">{{ row.offline_min || 5 }}min</template>
        </el-table-column>
        <el-table-column :label="T('Status')" min-width="70" align="center">
          <template #default="{row}">
            <el-tag :type="row.enabled===1?'success':'danger'" size="small">
              {{ row.enabled===1 ? T('Enable') : T('Disable') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="T('Actions')" align="center" width="200" fixed="right">
          <template #default="{row}">
            <!-- <el-button @click="showTargets(row)" size="small">{{ T('SelectTargets') }}</el-button> -->
            <el-button @click="showRuleForm(row)" size="small">{{ T('Edit') }}</el-button>
            <el-button type="danger" @click="delRule(row)" size="small">{{ T('Delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Alert-rule form -->
    <el-dialog v-model="ruleFormVisible" :title="ruleEditId ? T('Edit') : T('Add')" width="500px" append-to-body>
      <el-form>
        <el-form-item :label="T('Name')">
          <el-select v-model="ruleForm.channel_id" style="width:100%" :placeholder="T('AlertChannel')">
            <el-option v-for="ch in channels" :key="ch.row_id" :value="ch.row_id" :label="ch.name+' ('+channelLabel(ch.channel)+')'"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="T('MonitorScope')">
          <el-radio-group v-model="ruleForm.monitor_all" @change="onRuleMonitorChange">
            <el-radio :value="1">{{ T('AllDevices') }}</el-radio>
            <el-radio :value="2">{{ T('SelectTargets') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="ruleForm.monitor_all===2" :label="T('SelectTargets')">
          <div v-if="targetCollections.length>0" style="max-height:240px;overflow-y:auto;border:1px solid #dcdfe6;border-radius:4px;padding:8px">
            <div v-for="col in targetCollections" :key="'c-'+col.id" style="margin-bottom:4px">
              <el-checkbox v-model="targetSelectedColls" :label="col.id" @change="()=>onTargetCollToggle(col)">
                <strong>{{ col.name }}</strong>
                <span style="color:var(--apple-gray);font-size:12px;margin-left:4px">({{ col.peer_count }})</span>
              </el-checkbox>
              <div v-if="targetExpanded[col.id]" style="margin-left:28px;margin-top:2px">
                <div v-for="peer in (col.peers||[])" :key="'p-'+peer.peer_id" style="margin-bottom:2px">
                  <el-checkbox v-model="targetSelectedPeers" :label="peer.peer_id">
                    {{ peer.hostname || peer.peer_id }}
                  </el-checkbox>
                </div>
                <el-button v-if="!col.peersLoaded" size="small" type="text" @click="loadTargetPeers(col)">{{ T('LoadDevices') }}</el-button>
                <span v-else-if="col.peers&&col.peers.length===0" style="font-size:12px;color:var(--apple-gray)">{{ T('NoData') }}</span>
              </div>
            </div>
          </div>
          <div v-else style="color:var(--apple-gray);font-size:13px">{{ T('NoData') }}</div>
        </el-form-item>
        <el-form-item :label="T('OfflineMin')">
          <el-input-number v-model="ruleForm.offline_min" :min="1" :max="1440"></el-input-number>
          <span style="margin-left:8px;color:var(--apple-gray)">{{ T('MinutesShort') }}</span>
          <div style="font-size:12px;color:var(--apple-gray);margin-top:4px;line-height:1.5">
            Offline weighting starts after this duration (see the alert logic above).
          </div>
        </el-form-item>
        <el-form-item :label="T('Status')">
          <el-switch v-model="ruleForm.enabled" :active-value="1" :inactive-value="2"></el-switch>
        </el-form-item>
        <el-form-item :label="T('SmtpTo')" v-if="ruleChannelType==='smtp'">
          <el-input v-model="ruleForm.recipients" type="textarea" :rows="2"
            :placeholder="T('AlertRecipientsPlaceholder')"></el-input>
        </el-form-item>
        <el-form-item :label="T('SmtpTo')" v-else>
          <span style="font-size:12px;color:var(--apple-gray)">{{ recipientHint }}</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitRule">{{ T('Submit') }}</el-button>
          <el-button @click="ruleFormVisible=false">{{ T('Cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- Monitoring-target dialog -->
    <!-- <el-dialog v-model="targetVisible" :title="T('SelectTargets')" width="600px" append-to-body>
      <template v-if="currentAlertId>0">
        <el-button size="small" type="primary" style="margin-bottom:8px" @click="loadTargetCollections">{{ T('Refresh') }}</el-button>
        <el-radio-group v-model="targetMonitorAll" style="margin-bottom:8px" @change="onTargetMonitorChange">
          <el-radio :value="1">{{ T('AllDevices') }}</el-radio>
          <el-radio :value="2">{{ T('SelectTargets') }}</el-radio>
        </el-radio-group>
        <div v-if="targetMonitorAll===2 && targetCollections.length>0"
             style="max-height:350px;overflow-y:auto;border:1px solid #dcdfe6;border-radius:4px;padding:8px">
          <div v-for="col in targetCollections" :key="'c-'+col.id" style="margin-bottom:4px">
            <el-checkbox v-model="targetSelectedColls" :label="col.id" @change="()=>onTargetCollToggle(col)">
              <strong>{{ col.name }}</strong>
              <span style="color:var(--apple-gray);font-size:12px;margin-left:4px">({{ col.peer_count }})</span>
            </el-checkbox>
            <div v-if="targetExpanded[col.id]" style="margin-left:28px;margin-top:2px">
              <div v-for="peer in (col.peers||[])" :key="'p-'+peer.peer_id" style="margin-bottom:2px">
                <el-checkbox v-model="targetSelectedPeers" :label="peer.peer_id">
                  {{ peer.hostname || peer.peer_id }}
                </el-checkbox>
              </div>
              <el-button v-if="!col.peersLoaded" size="small" type="text" @click="loadTargetPeers(col)">{{ T('LoadDevices') }}</el-button>
              <span v-else-if="col.peers&&col.peers.length===0" style="font-size:12px;color:var(--apple-gray)">{{ T('NoData') }}</span>
            </div>
          </div>
        </div>
        <div v-else-if="targetMonitorAll===2 && targetCollections.length===0" style="color:var(--apple-gray);font-size:13px">{{ T('NoData') }}</div>
      </template>
      <template #footer>
        <el-button type="primary" @click="saveTargets">{{ T('Submit') }}</el-button>
        <el-button @click="targetVisible=false">{{ T('Cancel') }}</el-button>
      </template>
    </el-dialog> -->
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { T } from '@/utils/i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { list as getAlertList, create, update, remove } from '@/api/alert'
import request from '@/utils/request'

// Notification channels.
const channels = ref([])
const loadingCh = ref(false)
const chFormVisible = ref(false)
const chEditId = ref(0)
const chForm = reactive({
  name: '', channel: 'wecom', webhook_url: '',
  smtp_host: '', smtp_port: 465, smtp_user: '', smtp_pass: '',
})

// Alert rules.
const configs = ref([])
const loading = ref(false)
const ruleFormVisible = ref(false)
const ruleEditId = ref(0)
const ruleForm = reactive({ channel_id: null, monitor_all: 1, offline_min: 5, enabled: 1, recipients: '' })

// Monitoring targets.
const targetVisible = ref(false)
const currentAlertId = ref(0)
const targetMonitorAll = ref(1)
const targetCollections = ref([])
const targetSelectedColls = ref([])
const targetSelectedPeers = ref([])
const targetExpanded = reactive({})

const channelType = (ch) => ({ station:'info', wecom:'success', dingtalk:'warning', smtp:'primary' }[ch]||'')
const channelLabel = (ch) => ({ station:'In-app', wecom:'WeCom', dingtalk:'DingTalk', smtp:'Email' }[ch]||ch)

// Type of channel selected by the current rule.
const ruleChannelType = computed(() => {
  const ch = channels.value.find(c => c.row_id === ruleForm.channel_id)
  return ch ? ch.channel : ''
})
// Recipient description for non-SMTP channels.
const recipientHint = computed(() => {
  switch (ruleChannelType.value) {
    case 'station': return 'Send an in-app message to the current user'
    case 'wecom': return 'Send to a WeCom group bot; no recipient is required'
    case 'dingtalk': return 'Send to a DingTalk group bot; no recipient is required'
    default: return 'Select an SMTP channel before specifying recipients'
  }
})

// Display SMTP recipients from the rule; describe other recipients by channel type.
const getRecipient = (rule) => {
  if (rule.channel === 'smtp') return rule.recipients || '-'
  if (rule.channel === 'station') return 'Current user (in-app)'
  if (rule.channel === 'wecom' || rule.channel === 'dingtalk') return 'Group bot'
  return '-'
}

// ======== Notification-channel CRUD ========
const loadChannels = async () => {
  loadingCh.value = true
  const res = await request({ url: '/alert_channel/list' }).catch(_ => false)
  loadingCh.value = false
  if (res) channels.value = res.data.list || []
}

const showChannelForm = (row) => {
  chEditId.value = row?.row_id || 0
  Object.assign(chForm, row ? {
    name: row.name, channel: row.channel, webhook_url: row.webhook_url||'',
    smtp_host: row.smtp_host||'', smtp_port: row.smtp_port||465,
    smtp_user: row.smtp_user||'', smtp_pass: '',
  } : {
    name: '', channel: 'wecom', webhook_url: '',
    smtp_host: '', smtp_port: 465, smtp_user: '', smtp_pass: '',
  })
  chFormVisible.value = true
}

const submitChannel = async () => {
  const data = { ...chForm }
  if (chEditId.value) data.row_id = chEditId.value
  const api = chEditId.value ? 'update' : 'create'
  const res = await request({ url: `/alert_channel/${api}`, method: 'post', data }).catch(_ => false)
  if (res) {
    ElMessage.success(T('OperationSuccess'))
    chFormVisible.value = false
    loadChannels()
  }
}

const testChannel = async (row) => {
  let recipients = ''
  if (row.channel === 'smtp') {
    const r = await ElMessageBox.prompt('Enter a test recipient address (leave blank to send to yourself: ' + (row.smtp_user || '') + ')', 'Send Test', { inputValue: row.smtp_user || '', confirmButtonText: T('Send'), cancelButtonText: T('Cancel') }).catch(_ => false)
    if (r === false) return
    recipients = (r.value || '').trim()
  }
  const res = await request({
    url: '/alert_channel/test', method: 'post',
    data: {
      row_id: row.row_id, channel: row.channel, webhook_url: row.webhook_url,
      smtp_host: row.smtp_host, smtp_port: row.smtp_port, smtp_user: row.smtp_user,
      smtp_pass: '', test_recipients: recipients,
    },
  }).catch(e => { ElMessage.error('Test delivery failed: ' + (e?.response?.data?.msg || e.message)); return false })
  if (res) ElMessage.success('Test message sent. Please confirm receipt.')
}

const testChannelForm = async () => {
  let recipients = ''
  if (chForm.channel === 'smtp') {
    const r = await ElMessageBox.prompt('Enter a test recipient address (leave blank to send to yourself)', 'Send Test', { inputValue: chForm.smtp_user || '', confirmButtonText: T('Send'), cancelButtonText: T('Cancel') }).catch(_ => false)
    if (r === false) return
    recipients = (r.value || '').trim()
  }
  const data = { ...chForm, row_id: chEditId.value, test_recipients: recipients }
  const res = await request({ url: '/alert_channel/test', method: 'post', data }).catch(e => { ElMessage.error('Test delivery failed: ' + (e?.response?.data?.msg || e.message)); return false })
  if (res) ElMessage.success('Test message sent. Please confirm receipt.')
}

const delChannel = async (row) => {
  const cf = await ElMessageBox.confirm('Associated alert rules cannot send after deletion. Continue?', {
    type: 'warning',
    confirmButtonText: T('Confirm'),
    cancelButtonText: T('Cancel'),
  }).catch(_ => false)
  if (!cf) return
  const res = await request({ url: '/alert_channel/delete', method: 'post', data: { id: row.row_id } }).catch(_ => false)
  if (res) { ElMessage.success(T('OperationSuccess')); loadChannels() }
}

// ======== Alert-rule CRUD ========
const getRules = async () => {
  loading.value = true
  const res = await getAlertList().catch(_ => false)
  loading.value = false
  if (res) {
    const list = res.data.list || []
    for (const cfg of list) {
      const tRes = await request({ url: '/alert_config/targets', params: { alert_id: cfg.row_id } }).catch(_ => false)
      if (tRes) cfg.targets = tRes.data.list
    }
    configs.value = list
  }
}

const showRuleForm = async (row) => {
  ruleEditId.value = row?.row_id || 0
  ruleForm.channel_id = row?.channel_id || null
  ruleForm.monitor_all = row?.monitor_all || 1
  ruleForm.offline_min = row?.offline_min || 5
  ruleForm.enabled = row?.enabled || 1
  ruleForm.recipients = row?.recipients || ''
  targetCollections.value = []
  targetSelectedColls.value = []
  targetSelectedPeers.value = []
  Object.keys(targetExpanded).forEach(k => delete targetExpanded[k])
  if (ruleForm.monitor_all === 2 && row?.row_id) {
    await loadTargetCollections()
    const tRes = await request({ url: '/alert_config/targets', params: { alert_id: row.row_id } }).catch(_=>false)
    if (tRes && tRes.data.list) {
      for (const t of tRes.data.list) {
        if (t.target_type === 'collection') { targetSelectedColls.value.push(parseInt(t.target_id)); targetExpanded[parseInt(t.target_id)] = true }
        else targetSelectedPeers.value.push(t.target_id)
      }
      for (const col of targetCollections.value) { if (targetExpanded[col.id]) await loadTargetPeers(col) }
    }
  }
  ruleFormVisible.value = true
}

const onRuleMonitorChange = async (val) => {
  if (val === 2) {
    await loadTargetCollections()
  } else {
    targetSelectedColls.value = []
    targetSelectedPeers.value = []
  }
}

const submitRule = async () => {
  const data = { ...ruleForm }
  if (ruleEditId.value) data.row_id = ruleEditId.value
  const api = ruleEditId.value ? update : create
  const res = await api(data).catch(_ => false)
  if (res) {
    const alertId = ruleEditId.value || res.data?.row_id
    if (alertId) {
      const oldT = await request({ url: '/alert_config/targets', params: { alert_id: alertId } }).catch(_=>false)
      if (oldT && oldT.data.list) for (const t of oldT.data.list) { await request({ url: '/alert_config/targets/delete', method:'post', data:{id:t.row_id} }).catch(_=>false) }
      if (ruleForm.monitor_all === 2) {
        for (const colId of targetSelectedColls.value) { const col = targetCollections.value.find(c=>c.id===colId); await request({ url:'/alert_config/targets/create', method:'post', data:{ alert_id:alertId, target_type:'collection', target_id:String(colId), target_name:col?.name||'' } }).catch(_=>false) }
        for (const peerId of targetSelectedPeers.value) { await request({ url:'/alert_config/targets/create', method:'post', data:{ alert_id:alertId, target_type:'peer', target_id:peerId, target_name:peerId } }).catch(_=>false) }
      }
    }
    ElMessage.success(T('OperationSuccess'))
    ruleFormVisible.value = false
    getRules()
  }
}

const delRule = async (row) => {
  const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Delete') }), {
    type: 'warning',
    confirmButtonText: T('Confirm'),
    cancelButtonText: T('Cancel'),
  }).catch(_ => false)
  if (!cf) return
  const res = await remove({ id: row.row_id }).catch(_ => false)
  if (res) { ElMessage.success(T('OperationSuccess')); getRules() }
}

// ======== Monitoring targets ========
const loadTargetCollections = async () => {
  const res = await request({ url: '/alert_config/available_collections' }).catch(_ => false)
  if (res) targetCollections.value = (res.data.list||[]).map(c=>({...c,peers:[],peersLoaded:false}))
}

const loadTargetPeers = async (col) => {
  const res = await request({ url: '/alert_config/available_peers', params: { collection_id: col.id } }).catch(_ => false)
  if (res) { col.peers = res.data.list||[]; col.peersLoaded = true }
}

const onTargetCollToggle = (col) => {
  if (targetSelectedColls.value.includes(col.id)) {
    targetExpanded[col.id] = true
    if (!col.peersLoaded) loadTargetPeers(col).then(() => {
      for (const p of (col.peers||[])) { if (!targetSelectedPeers.value.includes(p.peer_id)) targetSelectedPeers.value.push(p.peer_id) }
    })
    else for (const p of (col.peers||[])) { if (!targetSelectedPeers.value.includes(p.peer_id)) targetSelectedPeers.value.push(p.peer_id) }
  } else {
    targetExpanded[col.id] = false
    if (col.peers) for (const p of col.peers) { const idx = targetSelectedPeers.value.indexOf(p.peer_id); if (idx>=0) targetSelectedPeers.value.splice(idx,1) }
  }
}
/* 
const onTargetMonitorChange = (val) => { if (val===1) { targetSelectedColls.value=[]; targetSelectedPeers.value=[] } }

const showTargets = async (row) => {
  currentAlertId.value = row.row_id
  targetMonitorAll.value = row.monitor_all || 1
  targetCollections.value = []; targetSelectedColls.value = []; targetSelectedPeers.value = []
  Object.keys(targetExpanded).forEach(k=>delete targetExpanded[k])
  await loadTargetCollections()
  if (targetMonitorAll.value===2) {
    const tRes = await request({ url: '/alert_config/targets', params: { alert_id: row.row_id } }).catch(_=>false)
    if (tRes && tRes.data.list) {
      for (const t of tRes.data.list) {
        if (t.target_type==='collection') { targetSelectedColls.value.push(parseInt(t.target_id)); targetExpanded[parseInt(t.target_id)]=true }
        else targetSelectedPeers.value.push(t.target_id)
      }
      for (const col of targetCollections.value) { if (targetExpanded[col.id]) await loadTargetPeers(col) }
    }
  }
  targetVisible.value = true
}

const saveTargets = async () => {
  const alertId = currentAlertId.value
  await update({ row_id: alertId, monitor_all: targetMonitorAll.value }).catch(_=>false)
  const oldT = await request({ url: '/alert_config/targets', params: { alert_id: alertId } }).catch(_=>false)
  if (oldT && oldT.data.list) for (const t of oldT.data.list) { await request({ url: '/alert_config/targets/delete', method:'post', data:{id:t.row_id} }).catch(_=>false) }
  if (targetMonitorAll.value===2) {
    for (const colId of targetSelectedColls.value) { const col = targetCollections.value.find(c=>c.id===colId); await request({ url:'/alert_config/targets/create', method:'post', data:{ alert_id:alertId, target_type:'collection', target_id:String(colId), target_name:col?.name||'' } }).catch(_=>false) }
    for (const peerId of targetSelectedPeers.value) { await request({ url:'/alert_config/targets/create', method:'post', data:{ alert_id:alertId, target_type:'peer', target_id:peerId, target_name:peerId } }).catch(_=>false) }
  }
  ElMessage.success(T('OperationSuccess'))
  targetVisible.value = false
  getRules()
} */

onMounted(() => { loadChannels(); getRules() })
</script>

<template>
  <div class="org-wrap">
    <!-- Left: department tree -->
    <el-card class="org-tree" shadow="hover">
      <template #header>
        <div class="tree-header">
          <span>{{ T('OrgStructure') }}</span>
          <el-button size="small" type="primary" @click="toAddRoot">{{ T('AddRootDept') }}</el-button>
        </div>
      </template>
      <el-tree
        ref="treeRef"
        :data="treeData"
        node-key="id"
        :props="{ label: 'name', children: 'children' }"
        default-expand-all
        highlight-current
        :expand-on-click-node="false"
        @current-change="onNodeClick"
      >
        <template #default="{ node, data }">
          <span class="tree-node">
            <span>{{ node.label }}</span>
            <span class="tree-node-meta">{{ data.user_count }}</span>
          </span>
        </template>
      </el-tree>
    </el-card>

    <!-- Right: department members -->
    <el-card class="org-members" shadow="hover">
      <template #header>
        <div class="member-header">
          <span class="member-title">{{ currentDept ? currentDept.name : T('AllMembers') }}</span>
          <span class="member-actions" v-if="currentDept">
            <el-button size="small" @click="toAddChild(currentDept)">{{ T('AddChildDept') }}</el-button>
            <el-button size="small" @click="toEdit(currentDept)">{{ T('Edit') }}</el-button>
            <el-button size="small" type="danger" @click="delDept(currentDept)">{{ T('Delete') }}</el-button>
          </span>
        </div>
      </template>
      <el-form inline class="member-query">
        <el-form-item :label="T('Username')">
          <el-input v-model="listQuery.username" clearable @keyup.enter="handlerQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlerQuery">{{ T('Filter') }}</el-button>
        </el-form-item>
      </el-form>
      <el-table class="list-table" :data="listRes.list" v-loading="listRes.loading" border>
        <el-table-column prop="id" :label="T('ID')" min-width="80" align="center" />
        <el-table-column prop="username" :label="T('Username')" />
        <el-table-column prop="nickname" :label="T('Nickname')" />
        <el-table-column :label="T('Group')">
          <template #default="{row}">{{ groupName(row.group_id) }}</template>
        </el-table-column>
        <el-table-column :label="T('Role')" min-width="100" align="center">
          <template #default="{row}">
            <el-tag v-if="row.role === 'admin'" type="danger" size="small">Administrator</el-tag>
            <span v-else>Regular User</span>
          </template>
        </el-table-column>
        <el-table-column :label="T('Status')" min-width="90" align="center">
          <template #default="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? T('Enable') : T('Disable') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="T('Remark')" />
      </el-table>
      <el-pagination
        class="member-page"
        background
        layout="prev, pager, next, sizes, jumper"
        :page-sizes="[10,20,50,100]"
        v-model:page-size="listQuery.page_size"
        v-model:current-page="listQuery.page"
        :total="listRes.total"
        @current-change="getList"
        @size-change="handlerQuery"
      />
    </el-card>

    <!-- Department add/edit dialog -->
    <el-dialog v-model="formVisible" :title="!formData.id ? T('Add') : T('Update')" width="600">
      <el-form :model="formData">
        <el-form-item :label="T('DepartmentName')" required>
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item :label="T('Type')">
          <el-radio-group v-model="formData.type">
            <el-radio :label="1">{{ T('CommonGroup') }}</el-radio>
            <el-radio :label="2">{{ T('SharedGroup') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="T('ParentDept')">
          <el-tree-select
            v-model="formData.parent_id"
            :data="parentTreeData"
            :props="{ label: 'name', children: 'children' }"
            value-key="id"
            node-key="id"
            check-strictly
            :render-after-expand="false"
            clearable
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">{{ T('Cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ T('Submit') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { onMounted, reactive, ref, computed } from 'vue'
import { tree as groupTree, create, update, remove as removeGroup } from '@/api/group'
import { list as userList } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { T } from '@/utils/i18n'

  const treeRef = ref(null)
  const treeData = ref([])
  const currentDept = ref(null)

  const getTree = async () => {
    const res = await groupTree().catch(_ => false)
    if (res) {
      treeData.value = res.data || []
    }
  }

  // Flatten departments to make lookup by ID easier
  const flatGroups = computed(() => {
    const map = {}
    const walk = (nodes) => {
      nodes.forEach(n => {
        map[n.id] = n
        if (n.children && n.children.length) {
          walk(n.children)
        }
      })
    }
    walk(treeData.value)
    return map
  })
  const groupName = (id) => {
    if (!id) return '-'
    return flatGroups.value[id] ? flatGroups.value[id].name : ('#' + id)
  }

  const onNodeClick = (data) => {
    currentDept.value = data
    listQuery.page = 1
    getList()
  }

  // Member list
  const listRes = reactive({ list: [], total: 0, loading: false })
  const listQuery = reactive({ page: 1, page_size: 10, username: '' })

  const getList = async () => {
    listRes.loading = true
    const params = { ...listQuery }
    if (currentDept.value) {
      params.group_id = currentDept.value.id
    }
    const res = await userList(params).catch(_ => false)
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

  // Department dialog
  const formVisible = ref(false)
  const formData = reactive({ id: 0, name: '', type: 1, parent_id: 0 })

  // Disable self and descendants as parent department during editing
  const parentTreeData = computed(() => {
    const forbidden = new Set()
    if (formData.id) {
      forbidden.add(formData.id)
      collectDescendantIds(treeData.value, formData.id, forbidden)
    }
    return mapTree(treeData.value, forbidden)
  })
  const collectDescendantIds = (nodes, targetId, set) => {
    nodes.forEach(n => {
      if (n.id === targetId) {
        if (n.children) n.children.forEach(c => { set.add(c.id); collectDescendantIds(n.children, c.id, set) })
        return
      }
      if (n.children) collectDescendantIds(n.children, targetId, set)
    })
  }
  const mapTree = (nodes, forbidden) => {
    return nodes.map(n => ({
      ...n,
      disabled: forbidden.has(n.id),
      children: n.children && n.children.length ? mapTree(n.children, forbidden) : [],
    }))
  }

  const toAddRoot = () => {
    formVisible.value = true
    formData.id = 0
    formData.name = ''
    formData.type = 1
    formData.parent_id = 0
  }
  const toAddChild = (dept) => {
    formVisible.value = true
    formData.id = 0
    formData.name = ''
    formData.type = dept.type
    formData.parent_id = dept.id
  }
  const toEdit = (dept) => {
    formVisible.value = true
    formData.id = dept.id
    formData.name = dept.name
    formData.type = dept.type
    formData.parent_id = dept.parent_id
  }
  const submit = async () => {
    if (!formData.name) {
      ElMessage.warning(T('ParamRequired', { param: T('DepartmentName') }))
      return
    }
    const payload = { ...formData, parent_id: formData.parent_id || 0 }
    const api = formData.id ? update : create
    const res = await api(payload).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      formVisible.value = false
      await getTree()
      getList()
    }
  }
  const delDept = async (dept) => {
    const cf = await ElMessageBox.confirm(T('Confirm?', { param: T('Delete') }), {
      confirmButtonText: T('Confirm'),
      cancelButtonText: T('Cancel'),
      type: 'warning',
    }).catch(_ => false)
    if (!cf) return false
    const res = await removeGroup({ id: dept.id }).catch(_ => false)
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      if (currentDept.value && currentDept.value.id === dept.id) {
        currentDept.value = null
      }
      await getTree()
      getList()
    }
  }

  onMounted(() => {
    getTree()
    getList()
  })
</script>

<style scoped lang="scss">
.org-wrap {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.org-tree {
  width: 320px;
  flex: 0 0 320px;
  max-height: calc(100vh - 140px);
  overflow: auto;
}
.org-members {
  flex: 1 1 auto;
  min-width: 0;
}
.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tree-node {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}
.tree-node-meta {
  margin-left: 8px;
  font-size: 12px;
  color: #999;
}
.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.member-title {
  font-weight: 600;
}
.member-query {
  margin-bottom: 8px;
}
.member-tip {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
}
.member-page {
  margin-top: 12px;
  justify-content: flex-end;
}
</style>

<template>
  <div class="app-container">
    <!-- Action bar -->
    <div class="mb-2">
      <el-button type="primary" icon="el-icon-plus" @click="handleCreate">
        Generate Invite Code
      </el-button>
    </div>

    <!-- Table -->
    <el-table
      :data="list"
      v-loading="listLoading"
      border
      stripe
      style="width: 100%"
    >
      <el-table-column :label="T('ID')" prop="id" width="60" />
      <el-table-column label="Invite Code" prop="code" min-width="160" />
      <el-table-column label="Plan" width="100">
        <template slot-scope="{ row }">
          <el-tag :type="row.plan === 'pro' ? 'primary' : 'warning'" size="mini">
            {{ row.plan }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Status" width="90">
        <template slot-scope="{ row }">
          <el-tag
            :type="row.status === 'unused' ? 'success' : (row.status === 'used' ? 'info' : 'danger')"
            size="mini"
          >
            {{ row.status === 'unused' ? 'Unused' : (row.status === 'used' ? 'Used' : 'Revoked') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Used By" width="120" prop="used_by" />
      <el-table-column label="Expiration Time" width="170" prop="expire_at" />
      <el-table-column label="Created At" width="170" prop="created_at" />
      <el-table-column label="Actions" width="120" fixed="right">
        <template slot-scope="{ row }">
          <el-button
            v-if="row.status === 'unused'"
            type="danger"
            size="mini"
            @click="handleRevoke(row)"
          >
            Revoke
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <el-pagination
      class="mt-2"
      @size-change="pageSize => { form.size = pageSize; fetchData() }"
      @current-change="page => { form.page = page; fetchData() }"
      :current-page="form.page"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="form.size"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
    >
    </el-pagination>

    <!-- Generate invite-code dialog -->
    <el-dialog title="Generate Invite Code" :visible.sync="createVisible" width="500px">
      <el-form ref="createForm" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="Plan" prop="plan">
          <el-select v-model="createForm.plan" placeholder="Please select a plan">
            <el-option label="Pro" value="pro" />
            <el-option label="Enterprise" value="enterprise" />
          </el-select>
        </el-form-item>
        <el-form-item label="Valid Days" prop="expire_days">
          <el-input-number v-model="createForm.expire_days" :min="1" :max="3650" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="createVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitCreate" :loading="creating">Confirm Generate</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { invitationList, invitationCreate, invitationRevoke } from '@/api/user';

export default {
  data () {
    return {
      list: [],
      listLoading: false,
      form: {
        page: 1,
        size: 10,
      },
      total: 0,
      createVisible: false,
      creating: false,
      createForm: {
        plan: 'pro',
        expire_days: 30,
      },
      createRules: {
        plan: [{ required: true, message: 'Please select a plan', trigger: 'change' }],
        expire_days: [{ required: true, message: 'Please enter valid days', trigger: 'blur' }],
      },
    }
  },
  created () {
    this.fetchData()
  },
  methods: {
    fetchData () {
      this.listLoading = true
      invitationList(this.form).then(res => {
        this.list = res.data.list || []
        this.total = res.data.total || 0
      }).finally(() => {
        this.listLoading = false
      })
    },
    handleCreate () {
      this.createForm = { plan: 'pro', expire_days: 30 }
      this.createVisible = true
      this.$nextTick(() => {
        this.$refs.createForm && this.$refs.createForm.clearValidate()
      })
    },
    submitCreate () {
      this.$refs.createForm.validate(valid => {
        if (!valid) return
        this.creating = true
        invitationCreate(this.createForm).then(() => {
          this.$message.success('Generated successfully')
          this.createVisible = false
          this.fetchData()
        }).finally(() => {
          this.creating = false
        })
      })
    },
    handleRevoke (row) {
      this.$confirm(`Are you sure you want to revoke invite code ${row.code}?`, 'Prompt', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }).then(() => {
        invitationRevoke(row.id).then(() => {
          this.$message.success('Revoked')
          this.fetchData()
        })
      })
    },
  },
}
</script>

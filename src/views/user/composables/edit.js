import { ref, onMounted, reactive, watch } from 'vue'
import { create, detail, update, remove } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { tree as groupTree } from '@/api/group'
import { T } from '@/utils/i18n'

export function useGetDetail (id) {
  let item = ref({})  // Preserve the original value.
  let form = ref({})
  const groupsList = ref([])
  const groupTreeData = ref([])
  const getDetail = async (id) => {
    const res = await detail(id)
    item.value = { ...res.data }
    form.value = {
      ...res.data,
      expiredAtDate: res.data.expired_at > 0 ? String(res.data.expired_at * 1000) : null,
    }
  }
  if (id > 0) {
    onMounted(_ => {getDetail(id)})
  }

  const getGroups = async () => {
    const res = await groupTree().catch(_ => false)
    if (res) {
      groupTreeData.value = res.data || []
      const flat = []
      const walk = (nodes) => nodes.forEach(n => { flat.push(n); if (n.children) walk(n.children) })
      walk(groupTreeData.value)
      groupsList.value = flat
    }
  }
  onMounted(getGroups)
  return {
    form,
    item,
    getDetail,
    groupsList,
    groupTreeData,
  }
}

export function useSubmit (form, id) {
  const root = ref(null)
  const router = useRouter()
  const rules = reactive({
    username: [{ required: true, message: T('ParamRequired', { param: T('Username') }) }],
    // email: [{ required: true, message: T('ParamRequired', { param: T('Email') }) }],
    group_id: [{ required: true, message: T('ParamRequired', { param: T('Group') }) }],
    // nickname: [{ required: true, message: 'Nickname is required' }],
    status: [{ required: true, message: T('ParamRequired', { param: T('Status') }) }],
  })

  const validate = async () => {
    const res = await root.value.validate().catch(err => false)
    return res
  }

  const submitCreate = async () => {
    const res = await create(form.value).catch(_ => false)
    return res.code === 0
  }

  const submitUpdate = async () => {
    // Convert expired_at.
    const payload = { ...form.value }
    if (payload.expiredAtDate) {
      payload.expired_at = Math.floor(Number(payload.expiredAtDate) / 1000)
    } else {
      payload.expired_at = 0
    }
    delete payload.expiredAtDate
    const res = await update(payload).catch(_ => false)
    return res.code === 0
  }
  const submitFunc = id > 0 ? submitUpdate : submitCreate

  const submit = async () => {
    const v = await validate()
    if (!v) {
      return
    }

    const res = await submitFunc()
    if (res) {
      ElMessage.success(T('OperationSuccess'))
      router.back()
    }
  }

  const cancel = () => {
    router.back()
  }

  return {
    root,
    rules,
    validate,
    submit,
    cancel,
  }
}



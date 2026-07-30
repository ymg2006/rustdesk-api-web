<template>
  <el-tag v-for="t in tags"
          :key="t.name"
          class="tag"
          :closable="t.closeable"
          :type="t.active ? 'primary' : 'info'"
          :class="{ 'tag--active': t.active }"
          effect="plain"
          @close="close(t)"
          @click="toTag(t)"
          @auxclick.middle.prevent.stop="t.closeable && close(t)">
    {{ T(t.title) }}
  </el-tag>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue';
import { useTagsStore } from '@/store/tags';
import { useRoute, useRouter } from 'vue-router';
import { T } from '@/utils/i18n';

export default defineComponent({
  name: 'Index',
  setup() {
    const tags = ref([])
    const tagsStore = useTagsStore()
    const route = useRoute()
    const router = useRouter()
    tags.value = tagsStore.tags

    const addTag = (route) => {
      if (!route.meta?.hide && route.name) {
        tagsStore.addTag(route)
      }
    }
    const close = (tag) => {
      tagsStore.removeTag(tag)
      if (tag.active) {
        toLastTag()
      }
    }
    const toLastTag = () => {
      if (tags.value.length) {
        router.push({ name: tags.value[tags.value.length - 1].name })
      }
    }
    const init = () => {
      if (!tagsStore.tags.length) {
        tagsStore.initTags()
      }
      addTag(route)
    }

    const toTag = (tag) => {
      if (tag.name !== route.name) {
        router.push({ name: tag.name })
      }
    }

    onMounted(init)
    watch(route, (val) => {
      addTag(val)
    })
    return {
      tags,
      addTag,
      close,
      toLastTag,
      toTag,
      T,
    }
  },
})
</script>

<style lang="scss" scoped>
.tag {
  cursor: pointer;
  margin-right: 6px;
  transition: all 0.2s ease;
  background: var(--el-color-primary-light-9);
}

.tag--active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
}
</style>

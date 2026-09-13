<script setup lang="ts">
import { provide } from 'vue'
import { MEDIA_FOLDER_TREE_CONTEXT, type useMediaFolderTree } from '../../composables/useMediaFolderTree'

const props = defineProps<{
  folderTree: ReturnType<typeof useMediaFolderTree>
}>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{ select: [folderId: string | null] }>()

const rootFolders = computed(() => props.folderTree.getChildren(null) ?? [])
const rootLoading = computed(() => props.folderTree.isLoading(null))

// Le niveau racine est rechargé à chaque ouverture (sans forcer si déjà en
// cache) pour refléter d'éventuelles créations/suppressions faites ailleurs
// depuis la dernière ouverture de cette modal.
watch(open, (isOpen) => {
  if (isOpen) props.folderTree.fetchChildren(null)
})

const selectFolder = (folderId: string | null) => {
  emit('select', folderId)
  open.value = false
}

provide(MEDIA_FOLDER_TREE_CONTEXT, {
  isActive: () => false,
  onActivate: (folder) => selectFolder(folder.id),
  folderTree: props.folderTree,
})
</script>

<template>
  <UModal v-model:open="open" title="Déplacer vers...">
    <template #body>
      <div class="space-y-1 max-h-80 overflow-y-auto">
        <UButton label="Racine" icon="i-lucide-house" variant="ghost" color="neutral" block class="justify-start"
          @click="selectFolder(null)" />

        <div v-if="rootLoading && rootFolders.length === 0" class="flex justify-center py-2">
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin text-neutral-400" />
        </div>

        <MediaFolderTreeNode v-for="folder in rootFolders" :key="folder.id" :folder="folder" :depth="0" />
      </div>
    </template>
  </UModal>
</template>

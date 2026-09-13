<script setup lang="ts">
import { provide } from 'vue'
import { MEDIA_FOLDER_TREE_CONTEXT, type useMediaFolderTree } from '../../composables/useMediaFolderTree'

const props = withDefaults(
  defineProps<{
    folderTree: ReturnType<typeof useMediaFolderTree>
    /** Masque le bouton "Nouveau dossier" quand l'action est déjà proposée ailleurs (ex. navbar). */
    hideCreate?: boolean
  }>(),
  { hideCreate: false }
)

const currentFolderId = defineModel<string | null>('currentFolderId', { default: null })
const emit = defineEmits<{ create: [name: string] }>()

onMounted(() => props.folderTree.fetchChildren(null))

const rootFolders = computed(() => props.folderTree.getChildren(null) ?? [])
const rootLoading = computed(() => props.folderTree.isLoading(null))

provide(MEDIA_FOLDER_TREE_CONTEXT, {
  isActive: (folderId) => currentFolderId.value === folderId,
  onActivate: (folder) => { currentFolderId.value = folder.id },
  folderTree: props.folderTree,
})

const creatingFolder = ref(false)
const newFolderName = ref('')

const submitNewFolder = () => {
  if (!newFolderName.value.trim()) return
  emit('create', newFolderName.value)
  newFolderName.value = ''
  creatingFolder.value = false
}

const cancelNewFolder = () => {
  creatingFolder.value = false
  newFolderName.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <template v-if="!hideCreate">
      <div v-if="creatingFolder" class="flex items-center gap-1 w-full">
        <UInput v-model="newFolderName" placeholder="Nom du dossier" size="sm" autofocus class="w-full"
          @keypress.enter="submitNewFolder" />
        <UButton icon="i-lucide-check" size="sm" @click="submitNewFolder" />
        <UButton icon="i-lucide-x" size="sm" color="neutral" variant="subtle" @click="cancelNewFolder" />
      </div>
      <UButton v-else icon="i-lucide-folder-plus" label="Nouveau dossier" variant="subtle" color="neutral" size="sm"
        class="w-full" @click="creatingFolder = true" />
    </template>

    <!-- Racine explicite pour revenir à la liste sans dossier -->
    <button type="button"
      class="w-full flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
      :class="!currentFolderId ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-medium' : 'text-neutral-700 dark:text-neutral-300'"
      @click="currentFolderId = null">
      <UIcon name="i-lucide-house" class="size-4" />
      <span>Racine</span>
    </button>

    <div v-if="rootLoading && rootFolders.length === 0" class="flex justify-center py-2">
      <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin text-neutral-400" />
    </div>

    <MediaFolderTreeNode v-for="folder in rootFolders" :key="folder.id" :folder="folder" :depth="0" />
  </div>
</template>

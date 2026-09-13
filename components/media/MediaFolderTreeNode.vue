<script setup lang="ts">
import { inject } from 'vue'
import type { MediaFolder } from '../../types'
import { MEDIA_FOLDER_TREE_CONTEXT } from '../../composables/useMediaFolderTree'

const props = defineProps<{
  folder: MediaFolder
  depth: number
}>()

const context = inject(MEDIA_FOLDER_TREE_CONTEXT)
if (!context) {
  throw new Error('MediaFolderTreeNode doit être utilisé à l\'intérieur d\'un composant qui fournit MEDIA_FOLDER_TREE_CONTEXT (ex: MediaFolderTree, MediaFolderPickerModal).')
}

const expanded = ref(false)
const hasChildren = computed(() => (props.folder.folder_count ?? 0) > 0)
const children = computed(() => context.folderTree.getChildren(props.folder.id))
const loading = computed(() => context.folderTree.isLoading(props.folder.id))
const isActive = computed(() => context.isActive(props.folder.id))

const ensureChildrenLoaded = () => {
  if (hasChildren.value && !children.value) {
    context.folderTree.fetchChildren(props.folder.id)
  }
}

// Le chevron (bascule uniquement l'ouverture/fermeture) est séparé du clic
// sur le libellé (qui navigue/sélectionne) pour éviter toute ambiguïté :
// cliquer sur le nom d'un dossier ne doit jamais surprendre l'utilisateur en
// le repliant/dépliant en même temps.
const toggleExpand = () => {
  if (!hasChildren.value) return
  expanded.value = !expanded.value
  if (expanded.value) ensureChildrenLoaded()
}

const handleActivate = () => {
  context.onActivate(props.folder)
  if (hasChildren.value && !expanded.value) {
    expanded.value = true
    ensureChildrenLoaded()
  }
}
</script>

<template>
  <div>
    <div
      class="flex items-center gap-1 rounded-md pr-1.5 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
      :class="isActive ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-medium' : 'text-neutral-700 dark:text-neutral-300'"
      :style="{ paddingLeft: `${depth * 16 + 4}px` }"
    >
      <button
        type="button"
        class="size-4 shrink-0 flex items-center justify-center"
        :class="hasChildren ? '' : 'invisible'"
        :aria-label="expanded ? 'Replier' : 'Déplier'"
        @click.stop="toggleExpand"
      >
        <UIcon v-if="loading" name="i-lucide-loader-circle" class="size-3.5 animate-spin text-neutral-400" />
        <UIcon v-else :name="expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="size-3.5" />
      </button>

      <button type="button" class="flex-1 min-w-0 flex items-center justify-between gap-2 text-left" @click="handleActivate">
        <span class="truncate">{{ folder.name }}</span>
        <UBadge :label="folder.medias_count ?? 0" color="primary" variant="soft" size="sm" class="rounded-full shrink-0" />
      </button>
    </div>

    <div v-if="expanded && hasChildren">
      <MediaFolderTreeNode v-for="child in children" :key="child.id" :folder="child" :depth="depth + 1" />
    </div>
  </div>
</template>

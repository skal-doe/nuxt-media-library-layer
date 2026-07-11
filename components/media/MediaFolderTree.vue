<script setup lang="ts">
import type { TreeItem } from '@nuxt/ui'
import type { MediaFolder } from '~/types'

const props = withDefaults(
  defineProps<{
    tree?: MediaFolder[]
    /** Masque le bouton "Nouveau dossier" quand l'action est déjà proposée ailleurs (ex. navbar). */
    hideCreate?: boolean
  }>(),
  { hideCreate: false }
)

const currentFolderId = defineModel<string | null>('currentFolderId', { default: null })
const emit = defineEmits<{ create: [name: string] }>()

// L'UTree a besoin de l'item sélectionné (pas juste son id) pour surligner
// la bonne ligne. On garde cet état local et on le synchronise avec
// currentFolderId dans les deux sens : quand on clique dans l'arbre, et
// quand la navigation se fait ailleurs (fil d'ariane, clic sur une carte
// dossier dans la grille).
const selectedItem = ref<MediaFolder | undefined>(undefined)

watch(selectedItem, (folder) => {
  currentFolderId.value = folder?.id ?? null
})

watch(currentFolderId, (id) => {
  if (id === (selectedItem.value?.id ?? null)) return
  selectedItem.value = undefined
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
  <div class="space-y-4">
    <template v-if="!hideCreate">
      <UFieldGroup v-if="creatingFolder" class="w-full">
        <UInput v-model="newFolderName" placeholder="Nom du dossier" size="sm" autofocus class="w-full"
          @keypress.enter="submitNewFolder" />
        <UButton icon="i-lucide-check" size="sm" @click="submitNewFolder" />
        <UButton icon="i-lucide-x" size="sm" color="neutral" variant="subtle" @click="cancelNewFolder" />
      </UFieldGroup>
      <UButton v-else icon="i-lucide-folder-plus" label="Nouveau dossier" variant="subtle" color="neutral" size="sm"
        class="w-full" @click="creatingFolder = true" />
    </template>

    <UTree :items="props.tree" :get-key="(item: TreeItem) => item.id" v-model="selectedItem">
      <template #item-label="{ item }">
        <div class="flex items-center justify-between w-full gap-2">
          <p>{{ item.name }}</p>
          <UBadge :label="item.medias_count" color="primary" variant="soft" size="sm" class="rounded-full" />
        </div>
      </template>
    </UTree>
  </div>
</template>

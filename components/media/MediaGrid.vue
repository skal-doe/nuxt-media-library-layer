<script setup lang="ts">
import type { Media, MediaFolder } from '~/types'

defineProps<{
  folders: MediaFolder[]
  medias: Media[]
  pending: boolean
  page: number
  lastPage: number
  selectable?: boolean
  /** Mode sélection multiple (page dédiée) : voir MediaCard. */
  selectionMode?: boolean
  selectedIds?: string[]
  onDeleteFolder: (folderId: string) => Promise<void>
  onRenameFolder: (folderId: string, parentId: string | null, name: string) => Promise<void>
  onDeleteMedia: (mediaId: string) => Promise<void>
}>()

const emit = defineEmits<{
  changePage: [page: number]
  enterFolder: [folderId: string]
  selectMedia: [media: Media]
  toggleSelect: [mediaId: string]
  moveMedia: [media: Media]
  refresh: []
}>()
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-center" v-if="pending">
      <UIcon name="i-lucide-loader-circle" class="animate-spin" />
    </div>
    <template v-else>
      <div class="flex items-center justify-center">
        <UButton label="Rafraîchir" variant="soft" @click="emit('refresh')" />
      </div>

      <!--
                Bug corrigé par rapport à la version originale : la
                condition portait uniquement sur medias.length, donc un
                dossier ne contenant que des sous-dossiers (aucun média
                direct) affichait "Aucun média trouvé" au lieu de montrer
                ses sous-dossiers.
            -->
      <div class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 space-y-4" v-if="folders.length || medias.length">
        <MediaFolderCard v-for="folder in folders" :key="folder.id" :folder="folder" :on-delete="onDeleteFolder"
          :on-rename="onRenameFolder" @enter="emit('enterFolder', folder.id)" />
        <MediaCard v-for="media in medias" :key="media.id" :media="media" :selectable="selectable"
          :selection-mode="selectionMode" :selected="selectedIds?.includes(media.id)" :on-delete="onDeleteMedia"
          @select="emit('selectMedia', media)" @toggle-select="emit('toggleSelect', media.id)"
          @move="emit('moveMedia', media)" />
      </div>
      <p v-else class="text-center text-sm text-neutral-700 dark:text-neutral-400">
        Aucun média trouvé
      </p>

      <div class="flex justify-center pt-2" v-if="lastPage > 1">
        <UPagination :default-page="page" :total="lastPage" :items-per-page="1" :sibling-count="1"
          @update:page="emit('changePage', $event)" />
      </div>
    </template>
  </div>
</template>
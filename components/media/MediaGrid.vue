<script setup lang="ts">
import type { Media, MediaFolder } from '../../types'

withDefaults(
  defineProps<{
    folders?: MediaFolder[]
    medias: Media[]
    pending: boolean
    page: number
    lastPage: number
    selectable?: boolean
    /** Mode sélection multiple : affiche une case à cocher au lieu des actions individuelles. */
    selectionMode?: boolean
    selectedIds?: string[]
    isTrash?: boolean
  }>(),
  {
    folders: () => [],
    selectable: false,
    selectionMode: false,
    selectedIds: () => [],
    isTrash: false,
  }
)

const emit = defineEmits<{
  changePage: [page: number]
  enterFolder: [folderId: string]
  selectMedia: [media: Media]
  toggleSelect: [mediaId: string]
  moveMedia: [media: Media]
  refresh: []
  deleteFolder: [folderId: string]
  renameFolder: [folderId: string, name: string]
  deleteMedia: [mediaId: string]
  restoreMedia: [mediaId: string]
  forceDeleteMedia: [mediaId: string]
  previewMedia: [media: Media]
}>()
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-center p-8" v-if="pending">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>
    <template v-else>
      <div class="flex items-center justify-between">
        <p class="text-sm text-neutral-500">
          <span v-if="isTrash">Corbeille : </span>
          <span v-else-if="folders?.length">{{ folders.length }} dossier(s), </span>
          {{ medias.length }} fichier(s) affiché(s)
        </p>
        <UButton label="Rafraîchir" icon="i-lucide-refresh-cw" variant="soft" size="xs" @click="emit('refresh')" />
      </div>

      <div class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 space-y-4" v-if="(folders && folders.length > 0) || medias.length > 0">
        <!-- Dossiers (uniquement en vue normale) -->
        <template v-if="!isTrash && folders">
          <MediaFolderCard v-for="folder in folders" :key="folder.id" :folder="folder"
            @delete="emit('deleteFolder', folder.id)"
            @rename="(name) => emit('renameFolder', folder.id, name)"
            @enter="emit('enterFolder', folder.id)" />
        </template>

        <!-- Cartes Médias -->
        <MediaCard v-for="media in medias" :key="media.id" :media="media" :selectable="selectable"
          :selection-mode="selectionMode" :selected="selectedIds?.includes(media.id)" :is-trash="isTrash"
          @select="emit('selectMedia', media)" @toggle-select="emit('toggleSelect', media.id)"
          @move="emit('moveMedia', media)" @delete="emit('deleteMedia', media.id)"
          @restore="emit('restoreMedia', media.id)" @force-delete="emit('forceDeleteMedia', media.id)"
          @preview="emit('previewMedia', media)" />
      </div>

      <div v-else class="text-center py-12 space-y-2">
        <UIcon :name="isTrash ? 'i-lucide-trash-2' : 'i-lucide-folder-open'" class="size-12 mx-auto text-neutral-400" />
        <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {{ isTrash ? 'La corbeille est vide' : 'Aucun média trouvé dans ce dossier' }}
        </p>
      </div>

      <div class="flex justify-center pt-2" v-if="lastPage > 1">
        <UPagination :default-page="page" :total="lastPage" :items-per-page="1" :sibling-count="1"
          @update:page="emit('changePage', $event)" />
      </div>
    </template>
  </div>
</template>
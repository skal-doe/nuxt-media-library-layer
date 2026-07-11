<script setup lang="ts">
import type { Media } from '~/types'

const props = withDefaults(
  defineProps<{
    /** Affiche le bouton de sélection sur chaque carte média (usage modal). */
    selectable?: boolean
    /** Affiche le formulaire d'upload (permet de le masquer sur mobile, cf. FileUploadModal). */
    showUploadForm?: boolean
  }>(),
  { selectable: true, showUploadForm: true }
)

const emit = defineEmits<{ select: [media: Media] }>()

const {
  searchQuery,
  currentFolderId,
  breadcrumb,
  folders,
  medias,
  page,
  lastPage,
  pending,
  foldersTree,
  uploadPending,
  uploadFailures,
  loadInitial,
  goToPage,
  enterFolder,
  goToBreadcrumb,
  runSearch,
  clearSearch,
  createFolder,
  deleteFolder,
  renameFolder,
  uploadFiles,
  moveMedia,
  deleteMedia,
} = useMediaLibrary()

onMounted(() => loadInitial())

const handleSelect = (media: Media) => emit('select', media)

// Déplacement d'un média : le modal de sélection de dossier a besoin de
// savoir quel média est concerné entre l'ouverture et la confirmation.
const showMovePicker = ref(false)
const mediaToMove = ref<Media | null>(null)

const openMovePicker = (media: Media) => {
  mediaToMove.value = media
  showMovePicker.value = true
}

const handleMoveSelect = (folderId: string | null) => {
  if (mediaToMove.value) moveMedia(mediaToMove.value.id, folderId)
  mediaToMove.value = null
}
</script>

<template>
  <div class="grid md:grid-cols-3 gap-4">
    <div class="space-y-4">
      <MediaSearchBar v-model="searchQuery" @search="runSearch" @clear="clearSearch" />

      <MediaBreadcrumb :items="breadcrumb" @navigate="goToBreadcrumb" />

      <MediaFolderTree :tree="foldersTree?.data" v-model:current-folder-id="currentFolderId" @create="createFolder" />

      <USeparator />

      <MediaUploadForm :visible="showUploadForm" :pending="uploadPending" :failures="uploadFailures"
        :upload="uploadFiles" />
    </div>

    <div class="md:col-span-2">
      <MediaGrid :folders="folders" :medias="medias" :pending="pending" :page="page" :last-page="lastPage"
        :selectable="selectable" :on-delete-folder="deleteFolder" :on-rename-folder="renameFolder"
        :on-delete-media="deleteMedia" @change-page="goToPage" @enter-folder="enterFolder" @select-media="handleSelect"
        @move-media="openMovePicker" @refresh="() => goToPage(page)" />
    </div>
  </div>

  <MediaFolderPickerModal v-model:open="showMovePicker" :tree="foldersTree?.data" @select="handleMoveSelect" />
</template>
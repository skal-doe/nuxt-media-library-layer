<script setup lang="ts">
import type { Media } from '../../types'

const props = withDefaults(
  defineProps<{
    /** Affiche le bouton de sélection sur chaque carte média (usage modal). */
    selectable?: boolean
    /** Affiche le formulaire d'upload (permet de le masquer sur mobile, cf. FileUploadModal). */
    showUploadForm?: boolean
    /**
     * Filtre au format `accept` HTML (ex: "image/*"). Restreint les nouveaux
     * uploads et masque les médias existants qui ne correspondent pas
     * (ex: un champ avatar ne doit proposer que des images).
     */
    accept?: string
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
  isTrashView,
  page,
  lastPage,
  pending,
  uploadPending,
  uploadFailures,
  selectedMediaIds,
  isAllSelected,
  loadInitial,
  goToPage,
  enterFolder,
  goToBreadcrumb,
  runSearch,
  clearSearch,
  setTrashView,
  createFolder,
  deleteFolder,
  renameFolder,
  uploadFiles,
  moveMedia,
  bulkMoveMedias,
  deleteMedia,
  restoreMedia,
  forceDeleteMedia,
  toggleMediaSelection,
  clearMediaSelection,
  toggleSelectAllOnPage,
  deleteSelectedMedias,
  restoreSelectedMedias,
  forceDeleteSelectedMedias,
} = useMediaLibrary()

onMounted(() => loadInitial())

// Arbre des dossiers (sidebar + modal de déplacement) : une seule instance
// partagée pour que les deux composants voient le même cache par niveau.
const folderTree = useMediaFolderTree()

// Ces mutations agissent toujours sur des dossiers listés comme enfants du
// dossier courant (créés dedans, ou affichés comme cartes de la grille
// courante) : c'est donc ce niveau de l'arbre qu'il faut invalider/recharger
// après coup, pour que la sidebar reflète immédiatement le changement.
const handleCreateFolder = async (name: string) => {
  await createFolder(name)
  await folderTree.refresh(currentFolderId.value)
}

const handleDeleteFolder = async (folderId: string) => {
  await deleteFolder(folderId)
  await folderTree.refresh(currentFolderId.value)
}

const handleRenameFolder = async (folderId: string, name: string) => {
  await renameFolder(folderId, name)
  await folderTree.refresh(currentFolderId.value)
}

// Les médias qui ne correspondent pas au filtre `accept` du champ appelant
// (ex: un champ avatar avec accept="image/*") sont masqués de la grille :
// on ne doit pas pouvoir sélectionner un PDF pour un avatar.
const visibleMedias = computed(() =>
  medias.value.filter((media) => matchesAccept(media.mime_type, props.accept))
)

const selectionMode = ref(false)

const handleSelect = (media: Media) => emit('select', media)

// Déplacement d'un ou plusieurs médias :
const showMovePicker = ref(false)
const mediaToMove = ref<Media | null>(null)

const openMovePicker = (media: Media) => {
  mediaToMove.value = media
  showMovePicker.value = true
}

const openBulkMovePicker = () => {
  mediaToMove.value = null
  showMovePicker.value = true
}

const handleMoveSelect = (folderId: string | null) => {
  if (mediaToMove.value) {
    moveMedia(mediaToMove.value.id, folderId)
    mediaToMove.value = null
  } else if (selectedMediaIds.value.length > 0) {
    bulkMoveMedias(selectedMediaIds.value, folderId)
  }
}

// Visionneuse universelle (Lightbox)
const showPreviewModal = ref(false)
const mediaToPreview = ref<Media | null>(null)

const openPreview = (media: Media) => {
  mediaToPreview.value = media
  showPreviewModal.value = true
}
</script>

<template>
  <div class="grid md:grid-cols-3 gap-6">
    <!-- Sidebar gauche : Navigation et Upload -->
    <div class="space-y-4">
      <!-- Barre de recherche -->
      <MediaSearchBar v-model="searchQuery" @search="runSearch" @clear="clearSearch" />

      <!-- Onglets Mode Normal / Corbeille -->
      <div class="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <UButton :variant="!isTrashView ? 'solid' : 'ghost'" color="neutral" icon="i-lucide-images"
          label="Médiathèque" size="xs" block @click="setTrashView(false)" />
        <UButton :variant="isTrashView ? 'solid' : 'ghost'" color="neutral" icon="i-lucide-trash"
          label="Corbeille" size="xs" block @click="setTrashView(true)" />
      </div>

      <!-- Fil d'ariane (uniquement en vue normale) -->
      <MediaBreadcrumb v-if="!isTrashView" :items="breadcrumb" @navigate="goToBreadcrumb" />

      <!-- Arbre des dossiers (uniquement en vue normale) -->
      <MediaFolderTree v-if="!isTrashView" :folder-tree="folderTree" v-model:current-folder-id="currentFolderId"
        @create="handleCreateFolder" />

      <USeparator v-if="!isTrashView" />

      <!-- Formulaire d'Upload (uniquement en vue normale) -->
      <MediaUploadForm v-if="!isTrashView" :visible="showUploadForm" :pending="uploadPending"
        :failures="uploadFailures" :upload="uploadFiles" :accept="accept" />

      <!-- Message informatif Corbeille -->
      <div v-if="isTrashView" class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 space-y-1">
        <p class="font-medium text-neutral-700 dark:text-neutral-300">À propos de la corbeille</p>
        <p>Les médias supprimés restent conservés. Vous pouvez les restaurer ou les supprimer définitivement pour purger le fichier physique.</p>
      </div>
    </div>

    <!-- Contenu principal droit : Grille des médias -->
    <div class="md:col-span-2 space-y-4">
      <!-- Barre d'actions de sélection multiple -->
      <div class="flex items-center justify-between gap-2 p-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
        <div class="flex items-center gap-2">
          <UButton :variant="selectionMode ? 'solid' : 'outline'" color="neutral" size="xs"
            :icon="selectionMode ? 'i-lucide-check-square' : 'i-lucide-square'"
            :label="selectionMode ? 'Quitter sélection' : 'Sélectionner'"
            @click="() => { selectionMode = !selectionMode; if (!selectionMode) clearMediaSelection(); }" />

          <template v-if="selectionMode">
            <UButton size="xs" variant="ghost" color="neutral"
              :label="isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'"
              @click="toggleSelectAllOnPage" />
            <UBadge :label="`${selectedMediaIds.length} sélectionné(s)`" size="sm" color="primary" variant="soft" />
          </template>
        </div>

        <!-- Actions groupées -->
        <div v-if="selectionMode && selectedMediaIds.length > 0" class="flex items-center gap-1">
          <!-- Actions groupées en mode Corbeille -->
          <template v-if="isTrashView">
            <UButton size="xs" icon="i-lucide-rotate-ccw" color="primary" variant="subtle"
              label="Restaurer" @click="restoreSelectedMedias" />
            <UButton size="xs" icon="i-lucide-trash-2" color="error" variant="solid"
              label="Supprimer définitivement" @click="forceDeleteSelectedMedias" />
          </template>

          <!-- Actions groupées en mode Normal -->
          <template v-else>
            <UButton size="xs" icon="i-lucide-folder-symlink" color="neutral" variant="subtle"
              label="Déplacer" @click="openBulkMovePicker" />
            <UButton size="xs" icon="i-lucide-trash" color="error" variant="subtle"
              label="Mettre à la corbeille" @click="deleteSelectedMedias" />
          </template>
        </div>
      </div>

      <!-- Grille -->
      <MediaGrid :folders="folders" :medias="visibleMedias" :pending="pending" :page="page" :last-page="lastPage"
        :selectable="selectable && !isTrashView" :selection-mode="selectionMode" :selected-ids="selectedMediaIds"
        :is-trash="isTrashView"
        @delete-folder="handleDeleteFolder"
        @rename-folder="handleRenameFolder"
        @delete-media="deleteMedia"
        @restore-media="restoreMedia"
        @force-delete-media="forceDeleteMedia"
        @change-page="goToPage"
        @enter-folder="enterFolder"
        @select-media="handleSelect"
        @toggle-select="toggleMediaSelection"
        @move-media="openMovePicker"
        @preview-media="openPreview"
        @refresh="() => goToPage(page)" />
    </div>
  </div>

  <!-- Modal de sélection de dossier pour déplacement -->
  <MediaFolderPickerModal v-model:open="showMovePicker" :folder-tree="folderTree" @select="handleMoveSelect" />

  <!-- Modal de visionneuse universelle grand format (Lightbox) -->
  <MediaPreviewModal v-model:open="showPreviewModal" :media="mediaToPreview" />
</template>
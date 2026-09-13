<script setup lang="ts">
import type { Media } from '../../types'

const props = withDefaults(
  defineProps<{
    media: Media
    selectable?: boolean
    selectionMode?: boolean
    selected?: boolean
    isTrash?: boolean
  }>(),
  { selectable: false, selectionMode: false, selected: false, isTrash: false }
)

const emit = defineEmits<{
  select: []
  toggleSelect: []
  move: []
  delete: []
  restore: []
  forceDelete: []
  preview: []
}>()

const confirmingAction = ref<'delete' | 'forceDelete' | null>(null)

const triggerDelete = () => {
  confirmingAction.value = null
  emit('delete')
}

const formatDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

const isImage = computed(() => props.media.mime_type?.startsWith('image/'))
const isVideo = computed(() => props.media.mime_type?.startsWith('video/'))
const isAudio = computed(() => props.media.mime_type?.startsWith('audio/'))
const isPdf = computed(() => props.media.mime_type === 'application/pdf')
const isArchive = computed(() =>
  props.media.mime_type?.includes('zip') ||
  props.media.mime_type?.includes('tar') ||
  props.media.mime_type?.includes('rar')
)

const fileIcon = computed(() => {
  if (isVideo.value) return 'i-lucide-video'
  if (isAudio.value) return 'i-lucide-music'
  if (isPdf.value) return 'i-lucide-file-text'
  if (isArchive.value) return 'i-lucide-archive'
  return 'i-lucide-file'
})

const extension = computed(() => {
  const parts = props.media.name.split('.')
  return parts.length > 1 ? parts.pop()?.toUpperCase() : ''
})

const handleCardClick = () => {
  if (props.selectionMode) emit('toggleSelect')
}
</script>

<template>
  <div class="relative rounded-lg border overflow-hidden bg-white dark:bg-neutral-900 flex flex-col justify-between"
    :class="[
      selectionMode ? 'cursor-pointer' : '',
      selected ? 'border-primary-500 ring-2 ring-primary-500' : 'border-neutral-300 dark:border-neutral-800',
    ]" @click="handleCardClick">
    <UCheckbox v-if="selectionMode" :model-value="selected" class="absolute top-1.5 left-1.5 z-20" @click.stop
      @update:model-value="emit('toggleSelect')" />
    <UBadge v-if="!media.is_attached && !isTrash" label="Non utilisé" color="warning" size="sm"
      class="absolute top-1.5 z-10" :class="selectionMode ? 'left-9' : 'left-1.5'" />
    <UBadge v-if="isTrash" label="Corbeille" color="error" size="sm" class="absolute top-1.5 z-10"
      :class="selectionMode ? 'left-9' : 'left-1.5'" />

    <UPopover>
      <UButton icon="i-lucide-info" size="xs" color="neutral" variant="subtle"
        class="absolute top-1.5 right-1.5 z-10 rounded-full" />

      <template #content>
        <div class="p-3 space-y-1 text-sm max-w-64">
          <p class="font-medium break-all">{{ media.name }}</p>
          <p class="text-neutral-500">{{ media.size }} · {{ media.mime_type }}</p>

          <div v-if="media.usages?.length" class="space-y-0.5">
            <p class="text-neutral-500">Utilisé par :</p>
            <UBadge v-for="usage in media.usages" :key="`${usage.type}-${usage.id}`" variant="soft" color="primary"
              size="sm" :label="`${usage.name} ${usage.collection ? ` (${usage.collection})` : ''}`" class="mr-1" />
          </div>
          <p v-else class="text-neutral-500">Non utilisé actuellement</p>

          <UBadge v-if="media.uploaded_by" variant="soft" color="neutral" :label="`Par ${media.uploaded_by?.name}`" />
          <p class="text-neutral-500">
            Créé le : {{ formatDate(media.created_at) }}
          </p>
          <p v-if="media.deleted_at" class="text-error-500">
            Supprimé le : {{ formatDate(media.deleted_at) }}
          </p>
        </div>
      </template>
    </UPopover>

    <!-- Aperçu image ou icône générique selon le type MIME -->
    <div
      class="group/thumb relative aspect-square w-full flex items-center justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-pointer select-none"
      @click.stop="selectionMode ? emit('toggleSelect') : emit('preview')">
      <img v-if="isImage" :src="media.url" :alt="media.name" :title="media.name"
        class="size-full object-cover transition-transform duration-200 group-hover/thumb:scale-105" loading="lazy" />
      <div v-else class="flex flex-col items-center justify-center gap-2 p-4 text-center">
        <UIcon :name="fileIcon" class="size-12 text-neutral-400" />
        <UBadge v-if="extension" :label="extension" size="xs" color="neutral" variant="subtle" />
        <p class="text-xs text-neutral-600 dark:text-neutral-300 font-medium truncate max-w-32">{{ media.name }}</p>
      </div>

      <!-- Overlay hover : agrandir en mode normal, (dé)sélectionner en mode sélection -->
      <div
        class="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-150 flex items-center justify-center">
        <div
          class="p-2 rounded-full bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-100 shadow-md">
          <UIcon :name="selectionMode ? 'i-lucide-check' : 'i-lucide-maximize-2'" class="size-4" />
        </div>
      </div>
    </div>

    <!-- Actions du bas de carte -->
    <div v-if="!selectionMode"
      class="p-1.5 flex items-center justify-between gap-1 border-t border-neutral-200 dark:border-neutral-800">
      <p class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{{ media.size }}</p>
      <div class="flex items-center gap-0.5">
        <!-- Mode Corbeille -->
        <template v-if="isTrash">
          <template v-if="confirmingAction === 'forceDelete'">
            <UButton size="sm" label="Purger" color="error" variant="solid" class="rounded-full"
              @click.stop="() => { confirmingAction = null; emit('forceDelete'); }" />
            <UButton size="sm" icon="i-lucide-x" color="neutral" variant="subtle" class="rounded-full"
              @click.stop="confirmingAction = null" />
          </template>
          <template v-else>
            <UTooltip text="Aperçu">
              <UButton size="sm" icon="i-lucide-eye" color="neutral" variant="subtle" class="rounded-full"
                @click.stop="emit('preview')" />
            </UTooltip>
            <UTooltip text="Restaurer">
              <UButton size="sm" icon="i-lucide-rotate-ccw" color="primary" variant="subtle" class="rounded-full"
                @click.stop="emit('restore')" />
            </UTooltip>
            <UTooltip text="Supprimer définitivement">
              <UButton size="sm" icon="i-lucide-trash-2" color="error" variant="subtle" class="rounded-full"
                @click.stop="confirmingAction = 'forceDelete'" />
            </UTooltip>
          </template>
        </template>

        <!-- Mode Normal -->
        <template v-else>
          <template v-if="confirmingAction === 'delete'">
            <UButton size="sm" label="Corbeille" color="error" variant="solid" class="rounded-full"
              @click.stop="triggerDelete" />
            <UButton size="sm" icon="i-lucide-x" color="neutral" variant="subtle" class="rounded-full"
              @click.stop="confirmingAction = null" />
          </template>
          <template v-else>
            <UTooltip text="Aperçu grand format">
              <UButton size="sm" icon="i-lucide-eye" color="neutral" variant="subtle" class="rounded-full"
                @click.stop="emit('preview')" />
            </UTooltip>
            <UTooltip v-if="selectable" text="Sélectionner">
              <UButton size="sm" icon="i-lucide-check" color="neutral" variant="subtle" class="rounded-full"
                @click.stop="emit('select')" />
            </UTooltip>
            <UTooltip text="Déplacer">
              <UButton size="sm" icon="i-lucide-folder-symlink" color="neutral" variant="subtle" class="rounded-full"
                @click.stop="emit('move')" />
            </UTooltip>
            <UTooltip text="Mettre à la corbeille">
              <UButton size="sm" icon="i-lucide-trash" color="error" variant="subtle" class="rounded-full"
                @click.stop="confirmingAction = 'delete'" />
            </UTooltip>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>
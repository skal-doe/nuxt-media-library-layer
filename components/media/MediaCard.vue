<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Media } from '~/types'

const props = withDefaults(
  defineProps<{
    media: Media
    selectable?: boolean
    /** Mode sélection multiple (page dédiée) : affiche une case à cocher au lieu des actions individuelles. */
    selectionMode?: boolean
    selected?: boolean
    onDelete: (mediaId: string) => Promise<void>
  }>(),
  { selectable: false, selectionMode: false, selected: false }
)

const emit = defineEmits<{ select: []; toggleSelect: []; move: [] }>()

const confirming = ref(false)
const processing = ref(false)

const confirmDelete = async () => {
  processing.value = true
  try {
    await props.onDelete(props.media.id)
  } finally {
    processing.value = false
    confirming.value = false
  }
}

const handleCardClick = () => {
  if (props.selectionMode) emit('toggleSelect')
}
</script>

<template>
  <div class="relative rounded-lg border overflow-hidden" :class="[
    selectionMode ? 'cursor-pointer' : '',
    selected ? 'border-primary-500 ring-2 ring-primary-500' : 'border-neutral-300 dark:border-neutral-800',
  ]" @click="handleCardClick">
    <UCheckbox v-if="selectionMode" :model-value="selected" class="absolute top-1.5 left-1.5 z-20" @click.stop
      @update:model-value="emit('toggleSelect')" />
    <UBadge v-if="!media.is_attached" label="Non utilisé" color="warning" size="sm" class="absolute top-1.5 z-10"
      :class="selectionMode ? 'left-9' : 'left-1.5'" />

    <UPopover>
      <UButton icon="i-lucide-info" size="xs" color="neutral" variant="subtle"
        class="absolute top-1.5 right-1.5 z-10 rounded-full" />

      <template #content>
        <div class="p-3 space-y-1 text-sm max-w-64">
          <p class="font-medium break-all">{{ media.name }}</p>
          <p class="text-neutral-500">{{ media.size }} · {{ media.mime_type }}</p>

          <div v-if="media.usages.length" class="space-y-0.5">
            <p class="text-neutral-500">Utilisé par :</p>
            <UBadge v-for="usage in media.usages" :key="`${usage.type}-${usage.id}`" variant="soft" color="primary"
              size="sm" :label="`${usage.name} ${usage.collection ? ` (${usage.collection})` : ''}`" class="mr-1" />
          </div>
          <p v-else class="text-neutral-500">Non utilisé actuellement</p>

          <UBadge v-if="media.uploaded_by" variant="soft" color="neutral" :label="`Par ${media.uploaded_by?.name}`" />
          <p class="text-neutral-500">
            {{ format(new Date(media.created_at), 'PPP à p', { locale: fr }) }}
          </p>
        </div>
      </template>
    </UPopover>

    <img :src="media.url" :alt="media.name" :title="media.name" class="size-full object-cover rounded-lg"
      loading="lazy" />

    <div v-if="!selectionMode" class="p-1.5 flex items-center justify-between gap-1">
      <p class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{{ media.size }}</p>
      <UFieldGroup class="space-x-0.5">
        <template v-if="confirming">
          <UButton size="sm" label="Confirmer" color="error" variant="solid" class="rounded-full" :loading="processing"
            @click="confirmDelete" />
          <UButton size="sm" icon="i-lucide-x" color="neutral" variant="subtle" class="rounded-full"
            :disabled="processing" @click="confirming = false" />
        </template>
        <template v-else>
          <UButton v-if="selectable" size="sm" icon="i-lucide-copy" color="neutral" variant="subtle"
            class="rounded-full" @click="emit('select')" />
          <UButton size="sm" icon="i-lucide-folder-symlink" color="neutral" variant="subtle" class="rounded-full"
            @click="emit('move')" />
          <UButton size="sm" icon="i-lucide-trash" color="error" variant="subtle" class="rounded-full"
            @click="confirming = true" />
        </template>
      </UFieldGroup>
    </div>
  </div>
</template>
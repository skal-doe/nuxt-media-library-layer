<script setup lang="ts">
import type { Media, MediaFieldValue, MediaPickerItem } from '../types'

const props = withDefaults(
  defineProps<{
    multiple?: boolean
    /**
     * Filtre au format `accept` HTML (ex: "image/*", "image/png,application/pdf").
     * Restreint à la fois les nouveaux uploads et les médias sélectionnables
     * dans la bibliothèque (ex: un champ avatar ne doit proposer que des images).
     */
    accept?: string
  }>(),
  { multiple: false }
)

const model = defineModel<MediaFieldValue | MediaPickerItem[]>()

const open = ref(false)
const showAddFiles = ref(true)

const toPickerItem = (media: Media): MediaPickerItem => ({
  id: media.id,
  url: media.url,
  name: media.name,
  mime_type: media.mime_type,
})

const handleSelect = (media: Media) => {
  if (props.multiple) {
    const current = Array.isArray(model.value) ? [...model.value] : []
    const exists = current.some((item) => (typeof item === 'string' ? item : item?.id) === media.id)
    if (!exists) {
      model.value = [...current, toPickerItem(media)]
    }
  } else {
    model.value = toPickerItem(media)
    open.value = false
  }
}
</script>

<template>
  <UModal :ui="{ content: 'max-w-7xl' }" v-model:open="open">
    <template #title>
      <div class="flex items-center justify-between gap-3">
        <span>{{ multiple ? 'Sélectionner des médias' : 'Sélectionner un média' }}</span>
        <div class="flex items-center gap-2">
          <UButton v-if="multiple" label="Terminer la sélection" color="primary" size="xs"
            @click="open = false" />
          <UButton :label="showAddFiles ? 'Masquer upload' : 'Nouvel upload'" color="neutral" variant="subtle"
            class="flex md:hidden rounded-full text-xs" @click="showAddFiles = !showAddFiles" />
        </div>
      </div>
    </template>

    <slot>
      <UTooltip :text="multiple ? 'Sélectionner des médias' : 'Sélectionner un média'">
        <UButton icon="i-lucide-image-up" variant="subtle" color="neutral" />
      </UTooltip>
    </slot>

    <template #body>
      <MediaLibrary v-if="open" selectable :show-upload-form="showAddFiles" :accept="accept" @select="handleSelect" />
    </template>
  </UModal>
</template>
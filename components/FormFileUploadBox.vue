<script setup lang="ts">
import type { MediaFieldValue, MediaPickerItem } from '../types'

const props = withDefaults(
  defineProps<{
    label?: string
    multiple?: boolean
    /** Filtre au format `accept` HTML (ex: "image/*") transmis au picker. */
    accept?: string
  }>(),
  {
    label: 'Veuillez téléverser un fichier',
    multiple: false,
  }
)

const model = defineModel<MediaFieldValue | MediaPickerItem[]>()

const removeItem = (index: number) => {
  if (Array.isArray(model.value)) {
    model.value = model.value.filter((_, i) => i !== index)
  }
}
</script>

<template>
  <!-- Mode Multi-médias (Galerie) -->
  <div v-if="multiple" class="space-y-3">
    <div v-if="Array.isArray(model) && model.length > 0" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      <div v-for="(item, idx) in model" :key="(typeof item === 'object' && item?.id) || idx"
        class="relative aspect-square rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden group bg-neutral-100 dark:bg-neutral-800">
        <img v-if="isImageItem(item)" :src="getItemUrl(item)" :alt="getItemName(item)" class="size-full object-cover" />
        <div v-else class="flex flex-col items-center justify-center size-full p-2 text-center">
          <UIcon name="i-lucide-file" class="size-8 text-neutral-400" />
          <p class="text-[10px] truncate max-w-full text-neutral-500">{{ getItemName(item) }}</p>
        </div>
        <UButton icon="i-lucide-trash" color="error" variant="solid" size="xs"
          class="absolute top-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          @click="removeItem(idx)" />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <FileUploadModal v-model="model" multiple :accept="accept">
        <UButton icon="i-lucide-plus" label="Ajouter des médias" color="neutral" variant="outline" size="sm" />
      </FileUploadModal>
      <span class="text-xs text-neutral-500">
        {{ Array.isArray(model) ? model.length : 0 }} élément(s) dans la galerie
      </span>
    </div>
  </div>

  <!-- Mode Unique (ex: Avatar, Thumbnail) -->
  <div v-else
    class="relative h-44 w-full rounded-md border border-dashed border-neutral-300 dark:border-neutral-700 overflow-hidden flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900/50">
    <template v-if="model">
      <img v-if="isImageItem(model)" :src="getItemUrl(model)" alt="" class="size-full object-cover" />
      <div v-else class="flex flex-col items-center justify-center p-4 text-center">
        <UIcon name="i-lucide-file" class="size-12 text-neutral-400 mb-2" />
        <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ getItemName(model) || 'Fichier sélectionné' }}</p>
      </div>
      <UButton icon="i-lucide-trash" variant="subtle" color="error" size="sm" class="absolute top-2 right-2"
        @click="model = null" />
    </template>

    <p v-else class="text-center text-sm text-neutral-500 px-4">{{ label }}</p>

    <div class="w-full p-2 flex items-center justify-center absolute bottom-0 left-0">
      <FileUploadModal v-model="model" :accept="accept">
        <UButton icon="i-lucide-upload" :label="model ? 'Changer' : 'Téléverser'" color="neutral" variant="subtle" size="sm" />
      </FileUploadModal>
    </div>
  </div>
</template>
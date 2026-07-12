<script setup lang="ts">
import type { Media } from '~/types'

const model = defineModel<{ id: string; url: string } | null>()

const open = ref(false)
const showAddFiles = ref(true)

const handleSelect = (media: Media) => {
  model.value = { id: media.id, url: media.url }
  open.value = false
}
</script>

<template>
  <UModal :ui="{ content: 'max-w-7xl' }" v-model:open="open">
    <template #title>
      <div class="flex items-center justify-between gap-3">
        Galerie
        <UButton :label="showAddFiles ? 'Annuler' : 'Nouvelle image'" color="primary"
          class="flex md:hidden rounded-full" @click="showAddFiles = !showAddFiles" />
      </div>
    </template>

    <slot>
      <UTooltip text="Télécharger une image">
        <UButton icon="i-lucide-image-up" variant="subtle" color="neutral" />
      </UTooltip>
    </slot>

    <template #body>
      <!--
                v-if="open" reproduit le comportement "lazy" d'origine : rien
                n'est chargé/fetché tant que la modal n'a pas été ouverte.
            -->
      <MediaLibrary v-if="open" selectable :show-upload-form="showAddFiles" @select="handleSelect" />
    </template>
  </UModal>
</template>
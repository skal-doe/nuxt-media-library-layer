<script setup lang="ts">
import type { MediaFieldValue, MediaPickerItem } from '../types'

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    max?: number
    allowCover?: boolean
    disabled?: boolean
    /** Filtre au format `accept` HTML (ex: "image/*") transmis au picker. */
    accept?: string
  }>(),
  {
    label: 'Galerie de médias',
    hint: 'La première image sert automatiquement d\'image de couverture principale.',
    allowCover: true,
    disabled: false,
  }
)

const model = defineModel<(MediaFieldValue | MediaPickerItem)[]>({ default: () => [] })

const items = computed<(MediaFieldValue | MediaPickerItem)[]>({
  get: () => (Array.isArray(model.value) ? model.value : []),
  set: (val) => {
    model.value = val
  },
})

const isMaxReached = computed(() => {
  return props.max ? items.value.length >= props.max : false
})

const moveItem = (fromIndex: number, toIndex: number) => {
  if (props.disabled) return
  if (toIndex < 0 || toIndex >= items.value.length) return
  const copy = [...items.value]
  const [target] = copy.splice(fromIndex, 1)
  copy.splice(toIndex, 0, target)
  items.value = copy
}

const makeCover = (index: number) => {
  if (props.disabled || index === 0) return
  moveItem(index, 0)
}

const removeItem = (index: number) => {
  if (props.disabled) return
  items.value = items.value.filter((_, i) => i !== index)
}

const clearAll = () => {
  if (props.disabled) return
  items.value = []
}
</script>

<template>
  <div class="space-y-3">
    <!-- En-tête : Titre, Indication & Compteur -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h4 v-if="label" class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {{ label }}
        </h4>
        <p v-if="hint && items.length > 0 && allowCover" class="text-xs text-neutral-500 mt-0.5">
          {{ hint }}
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <UBadge :label="max ? `${items.length} / ${max}` : `${items.length} média(s)`"
          :color="isMaxReached ? 'warning' : 'neutral'" size="sm" variant="soft" class="rounded-full" />
        <UButton v-if="items.length > 1 && !disabled" label="Vider" icon="i-lucide-trash-2" color="error"
          variant="ghost" size="xs" @click="clearAll" />
      </div>
    </div>

    <!-- Grille des médias de la galerie -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      <div v-for="(item, idx) in items" :key="(typeof item === 'object' && item?.id) || idx"
        class="group relative aspect-square rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-100 dark:bg-neutral-900 transition-all duration-150 hover:shadow-md"
        :class="{ 'ring-2 ring-primary-500 border-transparent': allowCover && idx === 0 }">
        <!-- Aperçu Média (Image ou Icône fichier) -->
        <img v-if="isImageItem(item)" :src="getItemUrl(item)" :alt="getItemName(item)"
          class="size-full object-cover select-none" loading="lazy" />
        <div v-else class="flex flex-col items-center justify-center size-full p-2 text-center">
          <UIcon name="i-lucide-file" class="size-8 text-neutral-400 mb-1" />
          <p class="text-[11px] font-medium truncate max-w-full text-neutral-600 dark:text-neutral-400">
            {{ getItemName(item) }}
          </p>
        </div>

        <!-- Badge Couverture (1ère image) -->
        <div v-if="allowCover && idx === 0"
          class="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-semibold shadow">
          <UIcon name="i-lucide-star" class="size-3 fill-current" />
          <span>Couverture</span>
        </div>

        <!-- Numérotation discrète si pas couverture -->
        <div v-else
          class="absolute top-2 left-2 z-10 flex items-center justify-center size-5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
          {{ idx + 1 }}
        </div>

        <!-- Boutons d'actions rapides (Suppression & Couverture) -->
        <div v-if="!disabled"
          class="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <UTooltip v-if="allowCover && idx !== 0" text="Définir comme couverture">
            <UButton icon="i-lucide-star" color="neutral" variant="solid" size="xs" class="rounded-full shadow-sm"
              @click.stop="makeCover(idx)" />
          </UTooltip>

          <UTooltip text="Retirer de la galerie">
            <UButton icon="i-lucide-trash" color="error" variant="solid" size="xs" class="rounded-full shadow-sm"
              @click.stop="removeItem(idx)" />
          </UTooltip>
        </div>

        <!-- Barre inférieure de réordonnancement (← et →) -->
        <div v-if="!disabled && items.length > 1"
          class="absolute inset-x-0 bottom-0 z-10 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="xs" :disabled="idx === 0"
            class="text-white hover:bg-white/20 disabled:opacity-30 rounded-full"
            @click.stop="moveItem(idx, idx - 1)" />

          <span class="text-[10px] text-white/80 font-mono">#{{ idx + 1 }}</span>

          <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="xs"
            :disabled="idx === items.length - 1" class="text-white hover:bg-white/20 disabled:opacity-30 rounded-full"
            @click.stop="moveItem(idx, idx + 1)" />
        </div>
      </div>

      <!-- Carte d'ajout dans la grille (si max non atteint) -->
      <FileUploadModal v-if="!isMaxReached && !disabled" v-model="model" multiple :accept="accept">
        <button type="button"
          class="size-full min-h-32 aspect-square rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all duration-150 flex flex-col items-center justify-center gap-1.5 p-3 text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer group">
          <div
            class="size-8 rounded-full bg-neutral-100 dark:bg-neutral-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 flex items-center justify-center transition-colors">
            <UIcon name="i-lucide-plus" class="size-4" />
          </div>
          <span class="text-xs font-medium">Ajouter</span>
        </button>
      </FileUploadModal>
    </div>

    <!-- Bouton complémentaire si galerie vide -->
    <div v-if="items.length === 0 && !disabled"
      class="p-6 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center gap-3 text-center bg-neutral-50/50 dark:bg-neutral-900/50">
      <div
        class="size-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
        <UIcon name="i-lucide-images" class="size-6" />
      </div>
      <div>
        <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Aucun média dans la galerie</p>
        <p class="text-xs text-neutral-500 mt-0.5">Ajoutez une ou plusieurs photos pour constituer la galerie.</p>
      </div>
      <FileUploadModal v-model="model" multiple :accept="accept">
        <UButton label="Ajouter des médias" icon="i-lucide-image-plus" color="primary" size="sm" class="rounded-full" />
      </FileUploadModal>
    </div>
  </div>
</template>

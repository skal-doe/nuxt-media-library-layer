<script setup lang="ts">
import type { MediaFolder } from '~/types'

const props = defineProps<{
  folder: MediaFolder
  onDelete: (folderId: string) => Promise<void>
  onRename: (folderId: string, parentId: string | null, name: string) => Promise<void>
}>()

const emit = defineEmits<{ enter: [] }>()

const confirming = ref(false)
const processing = ref(false)

const confirmDelete = async () => {
  processing.value = true
  try {
    await props.onDelete(props.folder.id)
  } finally {
    processing.value = false
    confirming.value = false
  }
}

const renaming = ref(false)
const renameProcessing = ref(false)
const newName = ref('')

const startRename = () => {
  newName.value = props.folder.name
  renaming.value = true
}

const confirmRename = async () => {
  if (!newName.value.trim() || newName.value === props.folder.name) {
    renaming.value = false
    return
  }
  renameProcessing.value = true
  try {
    await props.onRename(props.folder.id, props.folder.parent_id ?? null, newName.value)
  } finally {
    renameProcessing.value = false
    renaming.value = false
  }
}
</script>

<template>
  <div
    class="relative aspect-square rounded-lg border border-neutral-300 dark:border-neutral-800 overflow-hidden cursor-pointer flex flex-col items-center justify-center gap-1 hover:bg-neutral-50 dark:hover:bg-neutral-900"
    role="button" tabindex="0" @click="emit('enter')" @keydown.enter="emit('enter')">
    <UIcon name="i-lucide-folder" class="size-8 text-neutral-400" />
    <p class="text-xs font-medium text-center px-2 truncate w-full">{{ folder.name }}</p>
    <UBadge :label="`${folder.total_items} élément(s)`" size="sm" color="neutral" class="rounded-full" />

    <template v-if="renaming">
      <div class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-1 p-2" @click.stop>
        <UInput v-model="newName" size="xs" autofocus class="w-full" @keypress.enter="confirmRename"
          @keydown.esc="renaming = false" />
        <div class="flex gap-1">
          <UButton size="xs" icon="i-lucide-check" :loading="renameProcessing" @click="confirmRename" />
          <UButton size="xs" icon="i-lucide-x" color="neutral" variant="subtle" :disabled="renameProcessing"
            @click="renaming = false" />
        </div>
      </div>
    </template>
    <template v-else-if="confirming">
      <div class="absolute inset-0 bg-black/60 flex items-center justify-center gap-1" @click.stop>
        <UButton size="xs" label="Suppr." color="error" :loading="processing" @click="confirmDelete" />
        <UButton size="xs" icon="i-lucide-x" color="neutral" variant="subtle" :disabled="processing"
          @click="confirming = false" />
      </div>
    </template>
    <template v-else>
      <UButton icon="i-lucide-pencil" size="xs" variant="subtle" color="neutral"
        class="absolute top-1 left-1 rounded-full" @click.stop="startRename" />
      <UButton icon="i-lucide-x" size="xs" variant="subtle" color="neutral" class="absolute top-1 right-1 rounded-full"
        @click.stop="confirming = true" />
    </template>
  </div>
</template>
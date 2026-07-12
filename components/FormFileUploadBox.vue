<script setup lang="ts">
const model = defineModel<{ id: string, url: string } | null>()
</script>

<template>
  <div
    class="relative h-44 w-full rounded-md border border-dashed border-neutral-300 dark:border-neutral-700 overflow-hidden flex flex-col items-center justify-center">
    <img v-if="model" :src="model.url" alt="" class="size-full object-cover">
    <p v-else class="text-center text-sm text-neutral-500">Veuillez téléverser une image</p>
    <UButton icon="i-lucide-trash" variant="subtle" color="error" size="sm" class="absolute top-2 right-2"
      @click="model = null" v-if="model" />
    <div class="w-full p-2 flex items-center justify-center absolute bottom-0 left-0">
      <FileUploadModal v-model="model">
        <UButton icon="i-lucide-upload" label="Téléverser" color="neutral" variant="subtle" size="sm" class="" />
      </FileUploadModal>
    </div>
  </div>
</template>
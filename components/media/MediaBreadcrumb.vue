<script setup lang="ts">
defineProps<{
  items: { id: string; name: string }[]
}>()

const emit = defineEmits<{ navigate: [folderId: string | null] }>()
</script>

<template>
  <div class="flex items-center gap-1 text-sm flex-wrap">
    <UButton label="Racine" variant="link" size="sm" class="px-0" @click="emit('navigate', null)" />
    <template v-for="(crumb, index) in items" :key="crumb.id">
      <UIcon name="i-lucide-chevron-right" class="text-neutral-400" />
      <UButton :label="crumb.name" variant="link" size="sm" class="px-0" :disabled="index === items.length - 1"
        @click="emit('navigate', crumb.id)" />
    </template>
  </div>
</template>
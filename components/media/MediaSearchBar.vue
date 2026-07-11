<script setup lang="ts">
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ search: []; clear: [] }>()
</script>

<template>
  <UInput v-model="model" placeholder="Rechercher un fichier..." icon="i-lucide-search" class="w-full"
    @keypress.enter="emit('search')">
    <template v-if="model" #trailing>
      <UButton color="neutral" variant="link" size="sm" icon="i-lucide-circle-x" aria-label="Effacer"
        @click="emit('clear')" />
    </template>
  </UInput>
</template>
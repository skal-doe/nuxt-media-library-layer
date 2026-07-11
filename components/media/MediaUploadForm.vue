<script setup lang="ts">
import type { Media } from '~/types'

const props = withDefaults(
  defineProps<{
    pending: boolean
    failures: { file: string; errors: string[] }[]
    upload: (files: File[]) => Promise<Media[]>
    visible?: boolean
  }>(),
  { visible: true }
)

const files = ref<File[]>([])
const successCount = ref(0)

const submit = async () => {
  successCount.value = 0
  try {
    const uploaded = await props.upload(files.value)
    successCount.value = uploaded.length
    files.value = []
  } catch {
    // Les échecs sont déjà remontés via la prop `failures` (voir
    // useMediaLibrary::uploadFiles) — rien de plus à faire ici.
  }
}
</script>

<template>
  <div v-if="visible" class="space-y-4">
    <div class="bg-elevated/50 rounded-lg">
      <UScrollArea shadow class="p-4 max-h-72" :ui="{ viewport: 'gap-4' }">
        <UFileUpload v-model="files" layout="list" multiple label="Déposez vos images ici"
          description="PNG, JPG ou GIF (max. 2 Mo)" class="w-full" />
      </UScrollArea>
    </div>

    <UButton v-if="files.length > 0" label="Enregistrer les images" color="primary" class="rounded-md w-full"
      :loading="pending" @click="submit" />

    <p v-if="successCount" class="text-sm text-success-700 dark:text-success-400">
      {{ successCount }} image(s) téléchargée(s) avec succès
    </p>

    <div v-if="failures.length" class="text-sm text-error-700 dark:text-error-400 space-y-1">
      <p class="font-medium">{{ failures.length }} fichier(s) rejeté(s) :</p>
      <ul class="list-disc list-inside">
        <li v-for="failure in failures" :key="failure.file">
          <span class="font-medium">{{ failure.file }}</span> — {{ failure.errors[0] }}
        </li>
      </ul>
    </div>
  </div>
</template>
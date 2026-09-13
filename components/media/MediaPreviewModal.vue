<script setup lang="ts">
import type { Media } from '../../types'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  media: Media | null
}>()

const copied = ref(false)

const isImage = computed(() => props.media?.mime_type?.startsWith('image/'))
const isVideo = computed(() => props.media?.mime_type?.startsWith('video/'))
const isAudio = computed(() => props.media?.mime_type?.startsWith('audio/'))
const isPdf = computed(() => props.media?.mime_type === 'application/pdf')
const isArchive = computed(() =>
  props.media?.mime_type?.includes('zip') ||
  props.media?.mime_type?.includes('tar') ||
  props.media?.mime_type?.includes('rar')
)

const fileIcon = computed(() => {
  if (isVideo.value) return 'i-lucide-video'
  if (isAudio.value) return 'i-lucide-music'
  if (isPdf.value) return 'i-lucide-file-text'
  if (isArchive.value) return 'i-lucide-archive'
  return 'i-lucide-file'
})

const copyUrl = async () => {
  if (!props.media?.url) return
  try {
    await navigator.clipboard.writeText(props.media.url)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
  }
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'max-w-5xl' }">
    <!-- En-tête -->
    <template #title>
      <div v-if="media" class="flex items-center justify-between gap-4 w-full pr-6">
        <div class="flex items-center gap-2 min-w-0">
          <UIcon :name="isImage ? 'i-lucide-image' : fileIcon" class="size-5 text-primary-500 shrink-0" />
          <span class="font-bold text-sm truncate" :title="media.name">{{ media.name }}</span>
          <UBadge :label="media.size" color="neutral" variant="subtle" size="xs" class="shrink-0" />
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <UTooltip :text="copied ? 'Lien copié !' : 'Copier l\'URL'">
            <UButton :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" :color="copied ? 'success' : 'neutral'"
              variant="subtle" size="xs" @click="copyUrl" />
          </UTooltip>

          <UTooltip text="Télécharger / Ouvrir">
            <a :href="media.url" target="_blank" rel="noopener noreferrer" download>
              <UButton icon="i-lucide-download" color="neutral" variant="subtle" size="xs" />
            </a>
          </UTooltip>
        </div>
      </div>
    </template>

    <!-- Corps : Prévisualisation selon le type de fichier -->
    <template #body>
      <div v-if="media" class="grid grid-cols-3 gap-4">
        <!-- Zone d'affichage du média -->
        <div
          class="col-span-2 relative min-h-64 max-h-[60vh] rounded-xl bg-neutral-950/5 dark:bg-neutral-900/50 flex items-center justify-center p-3 overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <!-- Image -->
          <img v-if="isImage" :src="media.url" :alt="media.name"
            class="max-h-[55vh] w-auto max-w-full object-contain mx-auto rounded-lg shadow-md select-none" />

          <!-- Vidéo -->
          <video v-else-if="isVideo" controls preload="metadata"
            class="max-h-[55vh] max-w-full rounded-lg shadow-md mx-auto">
            <source :src="media.url" :type="media.mime_type" />
            Votre navigateur ne prend pas en charge la lecture de cette vidéo.
          </video>

          <!-- Audio -->
          <div v-else-if="isAudio"
            class="flex flex-col items-center justify-center gap-4 py-8 px-4 w-full max-w-md text-center">
            <div
              class="size-20 rounded-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 shadow-sm animate-pulse">
              <UIcon name="i-lucide-disc-3" class="size-10" />
            </div>
            <p class="font-medium text-sm text-neutral-800 dark:text-neutral-200">{{ media.name }}</p>
            <audio controls class="w-full">
              <source :src="media.url" :type="media.mime_type" />
              Votre navigateur ne prend pas en charge la lecture audio.
            </audio>
          </div>

          <!-- PDF -->
          <div v-else-if="isPdf" class="size-full flex flex-col items-center justify-center gap-3 py-6">
            <iframe :src="media.url"
              class="w-full h-96 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white" />
            <a :href="media.url" target="_blank" rel="noopener noreferrer">
              <UButton icon="i-lucide-external-link" label="Ouvrir le PDF en plein écran" color="primary"
                variant="subtle" size="xs" />
            </a>
          </div>

          <!-- Autre fichier (Zip, Docs, etc.) -->
          <div v-else class="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div
              class="size-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 shadow-sm">
              <UIcon :name="fileIcon" class="size-10" />
            </div>
            <div>
              <p class="font-medium text-sm text-neutral-800 dark:text-neutral-200">{{ media.name }}</p>
              <p class="text-xs text-neutral-500 mt-0.5">{{ media.mime_type }} · {{ media.size }}</p>
            </div>
            <a :href="media.url" target="_blank" rel="noopener noreferrer" download>
              <UButton icon="i-lucide-download" label="Télécharger ce fichier" color="primary" size="sm"
                class="rounded-full mt-2" />
            </a>
          </div>
        </div>

        <!-- Fiche technique & Métadonnées -->
        <div
          class="col-span-1 max-h-[60vh] overflow-y-auto space-y-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-file-type" class="size-4 text-neutral-400 shrink-0 mt-0.5" />
            <div class="min-w-0">
              <span class="text-neutral-500 block">Type MIME</span>
              <span class="font-mono text-neutral-800 dark:text-neutral-200 break-all">{{ media.mime_type || '-'
              }}</span>
            </div>
          </div>

          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-database" class="size-4 text-neutral-400 shrink-0 mt-0.5" />
            <div class="min-w-0">
              <span class="text-neutral-500 block">Taille du fichier</span>
              <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ media.size }} ({{ (media.file_size ||
                0).toLocaleString() }} octets)</span>
            </div>
          </div>

          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-calendar" class="size-4 text-neutral-400 shrink-0 mt-0.5" />
            <div class="min-w-0">
              <span class="text-neutral-500 block">Date d'ajout</span>
              <span class="text-neutral-800 dark:text-neutral-200">{{ formatDate(media.created_at) }}</span>
            </div>
          </div>

          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-server" class="size-4 text-neutral-400 shrink-0 mt-0.5" />
            <div class="min-w-0">
              <span class="text-neutral-500 block">Stockage (Disque)</span>
              <div class="flex items-center gap-1.5 mt-0.5">
                <UBadge :label="media.disk || 'public'" size="xs" color="neutral" variant="subtle" />
                <UBadge v-if="media.is_private" label="Privé" size="xs" color="warning" variant="subtle" />
              </div>
            </div>
          </div>

          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-user" class="size-4 text-neutral-400 shrink-0 mt-0.5" />
            <div class="min-w-0">
              <span class="text-neutral-500 block">Téléversé par</span>
              <span class="text-neutral-800 dark:text-neutral-200">{{ media.uploaded_by?.name || 'Système / Anonyme'
              }}</span>
            </div>
          </div>

          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-folder" class="size-4 text-neutral-400 shrink-0 mt-0.5" />
            <div class="min-w-0">
              <span class="text-neutral-500 block">Dossier</span>
              <span class="text-neutral-800 dark:text-neutral-200">{{ media.folder?.name || 'Racine' }}</span>
            </div>
          </div>

          <!-- Section Usages -->
          <div class="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-2 mb-1.5">
              <UIcon name="i-lucide-link-2" class="size-4 text-neutral-400 shrink-0" />
              <span class="text-neutral-500">Utilisé par</span>
            </div>
            <div v-if="media.usages && media.usages.length > 0" class="flex flex-wrap gap-1.5">
              <UBadge v-for="usage in media.usages" :key="`${usage.type}-${usage.id}`" color="primary" variant="soft"
                size="sm" class="rounded-md">
                <span class="font-semibold">{{ usage.type }} #{{ usage.id }}</span>
                <span v-if="usage.name" class="ml-1 opacity-80">({{ usage.name }})</span>
                <span v-if="usage.collection" class="ml-1 text-[10px] uppercase opacity-60">[{{ usage.collection
                }}]</span>
              </UBadge>
            </div>
            <p v-else class="text-neutral-400 italic">Ce média n'est utilisé nulle part pour le moment.</p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end w-full">
        <UButton label="Fermer" color="neutral" variant="subtle" @click="open = false" />
      </div>
    </template>
  </UModal>
</template>

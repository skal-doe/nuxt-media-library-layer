<script setup lang="ts">
import type { MediaFolder } from '~/types'

const open = defineModel<boolean>('open', { default: false })

defineProps<{
    tree?: MediaFolder[]
}>()

const emit = defineEmits<{ select: [folderId: string | null] }>()

const selectFolder = (folderId: string | null) => {
    emit('select', folderId)
    open.value = false
}

// Aplatit l'arbre pour un affichage simple en liste indentée, plutôt que
// de réutiliser UTree (pas besoin de sélection multiple/drag ici).
const flatten = (nodes: MediaFolder[] = [], depth = 0): { id: string; name: string; depth: number }[] =>
    nodes.flatMap((node) => [
        { id: node.id, name: node.name, depth },
        ...flatten(node.children ?? [], depth + 1),
    ])
</script>

<template>
    <UModal v-model:open="open" title="Déplacer vers...">
        <template #body>
            <div class="space-y-1 max-h-80 overflow-y-auto">
                <UButton label="Racine" icon="i-lucide-house" variant="ghost" color="neutral" block
                    class="justify-start" @click="selectFolder(null)" />
                <UButton v-for="folder in flatten(tree)" :key="folder.id" :label="folder.name" icon="i-lucide-folder"
                    variant="ghost" color="neutral" block class="justify-start"
                    :style="{ paddingLeft: `${(folder.depth + 1) * 20}px` }" @click="selectFolder(folder.id)" />
            </div>
        </template>
    </UModal>
</template>
import type { InjectionKey } from "vue";
import type { MediaFolder } from "../types";

const ROOT_KEY = "__root__";

const keyOf = (parentId: string | null) => parentId ?? ROOT_KEY;

/**
 * Charge l'arbre des dossiers niveau par niveau plutôt que d'un bloc :
 * l'API ne renvoie que les enfants directs d'un dossier (cf.
 * MediaFolderController::index côté Laravel), donc chaque niveau n'est
 * récupéré que lorsqu'un nœud est effectivement déplié. Les niveaux déjà
 * chargés sont mis en cache pour éviter de refaire la requête à chaque
 * repli/dépli, et peuvent être invalidés après une mutation (création,
 * renommage, suppression de dossier).
 *
 * Une seule instance doit être créée par arborescence affichée (cf.
 * MediaLibrary.vue) et partagée entre la sidebar et la modal de
 * déplacement, pour qu'elles voient un cache cohérent.
 */
export function useMediaFolderTree() {
  const client = useMediaLibraryClient();
  const config = useRuntimeConfig();
  const apiPrefix = config.public.mediaLibraryApiPrefix ?? "api/admin";

  const childrenByParent = ref<Record<string, MediaFolder[]>>({});
  const loadingParents = ref<Set<string>>(new Set());

  const getChildren = (parentId: string | null): MediaFolder[] | undefined =>
    childrenByParent.value[keyOf(parentId)];

  const isLoading = (parentId: string | null): boolean =>
    loadingParents.value.has(keyOf(parentId));

  const fetchChildren = async (
    parentId: string | null,
    { force = false }: { force?: boolean } = {},
  ): Promise<MediaFolder[]> => {
    const key = keyOf(parentId);

    if (!force && childrenByParent.value[key]) {
      return childrenByParent.value[key];
    }

    loadingParents.value.add(key);
    try {
      const response = await client<{ data: MediaFolder[] }>(
        `${apiPrefix}/folders`,
        { query: parentId ? { parent_id: parentId } : {} },
      );
      childrenByParent.value = {
        ...childrenByParent.value,
        [key]: response.data,
      };
      return response.data;
    } finally {
      loadingParents.value.delete(key);
    }
  };

  /** Oublie le niveau mis en cache : le prochain accès le rechargera. */
  const invalidate = (parentId: string | null) => {
    const key = keyOf(parentId);
    if (!(key in childrenByParent.value)) return;
    const next = { ...childrenByParent.value };
    delete next[key];
    childrenByParent.value = next;
  };

  /** Invalide puis recharge immédiatement un niveau (ex: après mutation). */
  const refresh = (parentId: string | null) => {
    invalidate(parentId);
    return fetchChildren(parentId, { force: true });
  };

  return {
    getChildren,
    isLoading,
    fetchChildren,
    invalidate,
    refresh,
  };
}

export interface MediaFolderTreeContext {
  /** Le dossier est-il celui actuellement affiché/surligné ? */
  isActive: (folderId: string) => boolean;
  /** Activation d'un nœud : navigation (sidebar) ou sélection (picker). */
  onActivate: (folder: MediaFolder) => void;
  folderTree: ReturnType<typeof useMediaFolderTree>;
}

export const MEDIA_FOLDER_TREE_CONTEXT: InjectionKey<MediaFolderTreeContext> =
  Symbol("media-folder-tree-context");

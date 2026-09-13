import type { Media, MediaFolder } from "../types";

/**
 * Logique complète de la bibliothèque de médias : navigation dans les dossiers,
 * recherche, pagination classique, upload, corbeille et actions groupées.
 *
 * Ce composable ne connaît rien de l'UI (modal ou page dédiée) — il expose
 * uniquement de l'état réactif et des actions. C'est aux composants (ex.
 * MediaLibrary.vue) de décider comment l'afficher.
 */
export function useMediaLibrary() {
  const client = useMediaLibraryClient();
  let toast: { add: (opt: any) => void };
  try {
    toast = useToast();
  } catch {
    toast = { add: () => {} };
  }
  const config = useRuntimeConfig();
  const apiPrefix = config.public.mediaLibraryApiPrefix ?? "api/admin";

  const searchQuery = ref("");
  const currentFolderId = ref<string | null>(null);
  const breadcrumb = ref<{ id: string; name: string }[]>([]);
  const folders = ref<MediaFolder[]>([]);
  const medias = ref<Media[]>([]);
  const isTrashView = ref(false);

  const page = ref(1);
  const lastPage = ref(1);
  const total = ref(0);
  const pending = ref(false);

  // Évite qu'une réponse arrivée en retard (navigation rapide, recherche
  // tapée puis effacée) n'écrase le résultat d'une requête plus récente.
  let requestId = 0;

  const fetchMedias = async (targetPage: number) => {
    pending.value = true;
    const thisRequest = ++requestId;

    try {
      const url = isTrashView.value
        ? `${apiPrefix}/medias/trash`
        : `${apiPrefix}/medias`;

      const response = await client<{
        folders?: MediaFolder[];
        data: Media[];
        meta: { current_page: number; last_page: number; total: number };
        breadcrumb?: { id: string; name: string }[];
      }>(url, {
        query: {
          page: targetPage,
          folder_id: isTrashView.value ? undefined : currentFolderId.value,
          search: searchQuery.value || undefined,
        },
      });

      if (thisRequest !== requestId) return;

      page.value = response.meta.current_page;
      lastPage.value = response.meta.last_page;
      total.value = response.meta.total;
      folders.value = response.folders ?? [];
      breadcrumb.value = response.breadcrumb ?? [];
      medias.value = response.data;
    } finally {
      if (thisRequest === requestId) pending.value = false;
    }
  };

  const loadInitial = () => fetchMedias(1);
  const goToPage = (targetPage: number) => {
    clearMediaSelection();
    return fetchMedias(targetPage);
  };

  watch(currentFolderId, loadInitial);

  const enterFolder = (folderId: string) => {
    currentFolderId.value = folderId;
  };

  const goToBreadcrumb = (folderId: string | null) => {
    currentFolderId.value = folderId;
  };

  const runSearch = () => loadInitial();

  const clearSearch = () => {
    searchQuery.value = "";
    loadInitial();
  };

  const setTrashView = (trash: boolean) => {
    isTrashView.value = trash;
    currentFolderId.value = null;
    clearMediaSelection();
    loadInitial();
  };

  // Création/suppression/renommage de dossier : ne rafraîchit ici que la
  // grille courante ("folders"/"medias"). L'arbre de la sidebar (chargé à la
  // demande niveau par niveau, cf. useMediaFolderTree) est rafraîchi
  // séparément par l'appelant (MediaLibrary.vue), qui sait quel niveau de
  // l'arbre est concerné par la mutation.
  const createFolder = async (name: string) => {
    if (!name.trim()) return;

    try {
      await client(`${apiPrefix}/folders`, {
        method: "POST",
        body: { name, parent_id: currentFolderId.value },
      });
      await loadInitial();
    } catch (e: any) {
      toast.add({
        title: "Erreur",
        description:
          e.data?.errors?.name?.[0] ?? "Impossible de créer le dossier",
        color: "error",
      });
      throw e;
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      await client(`${apiPrefix}/folders/${folderId}`, { method: "DELETE" });
      await loadInitial();
    } catch (e: any) {
      toast.add({
        title: "Erreur",
        description: e.data?.message ?? "Impossible de supprimer le dossier",
        color: "error",
      });
      throw e;
    }
  };

  // Rétrocompatible : accepte aussi bien (folderId, name) que l'ancienne signature (folderId, parentId, name)
  const renameFolder = async (
    folderId: string,
    arg2: string | null,
    arg3?: string
  ) => {
    const name = arg3 !== undefined ? arg3 : arg2;
    if (!name || !name.trim()) return;

    try {
      await client(`${apiPrefix}/folders/${folderId}`, {
        method: "PUT",
        body: { name },
      });
      await loadInitial();
    } catch (e: any) {
      toast.add({
        title: "Erreur",
        description:
          e.data?.errors?.name?.[0] ?? "Impossible de renommer le dossier",
        color: "error",
      });
      throw e;
    }
  };

  const uploadPending = ref(false);
  const uploadFailures = ref<{ file: string; errors: string[] }[]>([]);

  const uploadFiles = async (files: File[]): Promise<Media[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files[]", file));
    formData.append("folder_id", currentFolderId.value ?? "");

    uploadPending.value = true;
    uploadFailures.value = [];

    try {
      const response = await client<{
        data: Media[];
        failures: { file: string; errors: string[] }[];
      }>(`${apiPrefix}/medias`, { method: "post", body: formData });

      uploadFailures.value = response.failures ?? [];
      await fetchMedias(page.value);
      return response.data;
    } catch (e: any) {
      uploadFailures.value = e.data?.failures ?? [];
      throw e;
    } finally {
      uploadPending.value = false;
    }
  };

  const moveMedia = async (mediaId: string, targetFolderId: string | null) => {
    try {
      await client(`${apiPrefix}/medias/${mediaId}`, {
        method: "PUT",
        body: { folder_id: targetFolderId },
      });
      await fetchMedias(page.value);
      toast.add({
        title: "Succès",
        description: "Média déplacé avec succès",
        color: "success",
      });
    } catch (e: any) {
      toast.add({
        title: "Erreur",
        description: e.data?.message ?? "Le média n'a pas pu être déplacé",
        color: "error",
      });
      throw e;
    }
  };

  const bulkMoveMedias = async (ids: string[], targetFolderId: string | null) => {
    if (!ids.length) return;
    try {
      await client(`${apiPrefix}/medias/bulk-move`, {
        method: "POST",
        body: { media_ids: ids, folder_id: targetFolderId },
      });
      clearMediaSelection();
      await fetchMedias(page.value);
      toast.add({
        title: "Succès",
        description: `${ids.length} média(s) déplacé(s) avec succès`,
        color: "success",
      });
    } catch (e: any) {
      toast.add({
        title: "Erreur",
        description: e.data?.message ?? "Le déplacement groupé a échoué",
        color: "error",
      });
      throw e;
    }
  };

  // Soft delete d'un média unique
  const deleteMedia = async (id: string) => {
    try {
      await client(`${apiPrefix}/medias/${id}`, { method: "DELETE" });
      selectedMediaIds.value = selectedMediaIds.value.filter(
        (mediaId) => mediaId !== id,
      );
      await fetchMedias(page.value);
      toast.add({
        title: "Succès",
        description: "Média mis à la corbeille",
        color: "success",
      });
    } catch (e: any) {
      toast.add({
        title: "Erreur",
        description: e.data?.message ?? "Le média n'a pas pu être supprimé",
        color: "error",
      });
      throw e;
    }
  };

  // Restauration d'un média unique
  const restoreMedia = async (id: string) => {
    try {
      await client(`${apiPrefix}/medias/${id}/restore`, { method: "POST" });
      selectedMediaIds.value = selectedMediaIds.value.filter(
        (mediaId) => mediaId !== id,
      );
      await fetchMedias(page.value);
      toast.add({
        title: "Succès",
        description: "Média restauré avec succès",
        color: "success",
      });
    } catch (e: any) {
      toast.add({
        title: "Erreur",
        description: e.data?.message ?? "Impossible de restaurer le média",
        color: "error",
      });
      throw e;
    }
  };

  // Suppression définitive d'un média unique
  const forceDeleteMedia = async (id: string) => {
    try {
      await client(`${apiPrefix}/medias/${id}/force`, { method: "DELETE" });
      selectedMediaIds.value = selectedMediaIds.value.filter(
        (mediaId) => mediaId !== id,
      );
      await fetchMedias(page.value);
      toast.add({
        title: "Succès",
        description: "Média définitivement supprimé",
        color: "success",
      });
    } catch (e: any) {
      toast.add({
        title: "Erreur",
        description: e.data?.message ?? "Impossible de supprimer définitivement le média",
        color: "error",
      });
      throw e;
    }
  };

  // Sélection multiple
  const selectedMediaIds = ref<string[]>([]);

  const toggleMediaSelection = (id: string) => {
    selectedMediaIds.value = selectedMediaIds.value.includes(id)
      ? selectedMediaIds.value.filter((mediaId) => mediaId !== id)
      : [...selectedMediaIds.value, id];
  };

  const clearMediaSelection = () => {
    selectedMediaIds.value = [];
  };

  const isAllSelected = computed(
    () =>
      medias.value.length > 0 &&
      medias.value.every((media) => selectedMediaIds.value.includes(media.id)),
  );

  const toggleSelectAllOnPage = () => {
    selectedMediaIds.value = isAllSelected.value
      ? []
      : medias.value.map((media) => media.id);
  };

  // Bulk actions utilisant les endpoints dédiés côté serveur
  // Helper générique pour exécuter les actions groupées côté serveur
  const executeBulkAction = async (
    endpoint: string,
    actionName: string,
    successMessage: (count: number) => string,
    errorMessage: string
  ) => {
    const ids = [...selectedMediaIds.value];
    if (!ids.length) return;

    try {
      const res = await client<{
        deleted_count?: number;
        restored_count?: number;
        failures?: { id: string; name: string; reason: string }[];
      }>(`${apiPrefix}/medias/${endpoint}`, {
        method: "POST",
        body: { media_ids: ids },
      });

      clearMediaSelection();
      await fetchMedias(page.value);

      const count = res.deleted_count ?? res.restored_count ?? ids.length;

      if (res.failures?.length) {
        toast.add({
          title: `${actionName} partielle`,
          description: `${res.failures.length} élément(s) n'ont pas pu être traités.`,
          color: "warning",
        });
      } else {
        toast.add({
          title: "Succès",
          description: successMessage(count),
          color: "success",
        });
      }
    } catch (e: any) {
      toast.add({
        title: "Erreur",
        description: e.data?.message ?? errorMessage,
        color: "error",
      });
    }
  };

  const deleteSelectedMedias = () =>
    executeBulkAction(
      "bulk-delete",
      "Mise à la corbeille",
      (n) => `${n} média(s) mis à la corbeille`,
      "Erreur lors de la mise à la corbeille groupée"
    );

  const restoreSelectedMedias = () =>
    executeBulkAction(
      "bulk-restore",
      "Restauration",
      (n) => `${n} média(s) restauré(s)`,
      "Erreur lors de la restauration groupée"
    );

  const forceDeleteSelectedMedias = () =>
    executeBulkAction(
      "bulk-force-delete",
      "Suppression définitive",
      (n) => `${n} média(s) supprimé(s) définitivement`,
      "Erreur lors de la suppression définitive groupée"
    );

  watch(currentFolderId, clearMediaSelection);

  return {
    // état
    searchQuery,
    currentFolderId,
    breadcrumb,
    folders,
    medias,
    isTrashView,
    page,
    lastPage,
    total,
    pending,
    uploadPending,
    uploadFailures,
    selectedMediaIds,
    isAllSelected,
    // actions
    loadInitial,
    goToPage,
    enterFolder,
    goToBreadcrumb,
    runSearch,
    clearSearch,
    setTrashView,
    createFolder,
    deleteFolder,
    renameFolder,
    uploadFiles,
    moveMedia,
    bulkMoveMedias,
    deleteMedia,
    restoreMedia,
    forceDeleteMedia,
    toggleMediaSelection,
    clearMediaSelection,
    toggleSelectAllOnPage,
    deleteSelectedMedias,
    restoreSelectedMedias,
    forceDeleteSelectedMedias,
  };
}

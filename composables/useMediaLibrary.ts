import type { Media, MediaFolder } from "~/types";

/**
 * Logique complète de la bibliothèque de médias : navigation dans les dossiers,
 * recherche, pagination classique, upload et suppression.
 *
 * Ce composable ne connaît rien de l'UI (modal ou page dédiée) — il expose
 * uniquement de l'état réactif et des actions. C'est aux composants (ex.
 * MediaLibrary.vue) de décider comment l'afficher.
 */
export function useMediaLibrary() {
  const client = useSanctumClient();
  const toast = useToast();
  const config = useRuntimeConfig();
  const apiPrefix = config.public.mediaLibraryApiPrefix ?? "api/admin";

  const searchQuery = ref("");
  const currentFolderId = ref<string | null>(null);
  const breadcrumb = ref<{ id: string; name: string }[]>([]);
  const folders = ref<MediaFolder[]>([]);
  const medias = ref<Media[]>([]);

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
      const response = await client<{
        folders: MediaFolder[];
        data: Media[];
        meta: { current_page: number; last_page: number; total: number };
        breadcrumb: { id: string; name: string }[];
      }>(`${apiPrefix}/medias`, {
        query: {
          page: targetPage,
          folder_id: currentFolderId.value,
          search: searchQuery.value || undefined,
        },
      });

      if (thisRequest !== requestId) return;

      page.value = response.meta.current_page;
      lastPage.value = response.meta.last_page;
      total.value = response.meta.total;
      folders.value = response.folders;
      breadcrumb.value = response.breadcrumb;
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

  // Arbre de dossiers de la sidebar : indépendant de la navigation
  // "folders" (qui liste seulement les enfants du dossier courant), donc
  // rafraîchi séparément quand un dossier est créé/supprimé.
  const { data: foldersTree, refresh: refreshFoldersTree } =
    useLazySanctumFetch<{
      data: MediaFolder[];
    }>(`${apiPrefix}/folders`);

  const createFolder = async (name: string) => {
    if (!name.trim()) return;

    try {
      await client(`${apiPrefix}/folders`, {
        method: "POST",
        body: { name, parent_id: currentFolderId.value },
      });
      await Promise.all([loadInitial(), refreshFoldersTree()]);
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
      await Promise.all([loadInitial(), refreshFoldersTree()]);
    } catch (e: any) {
      toast.add({
        title: "Erreur",
        description: "Impossible de supprimer le dossier",
        color: "error",
      });
      throw e;
    }
  };

  // MediaFolderRequest valide l'unicité du nom scopée par parent_id ; sans
  // le renvoyer, la validation testerait l'unicité contre la racine au
  // lieu du vrai parent du dossier renommé. D'où la signature avec
  // parentId plutôt qu'un simple id.
  const renameFolder = async (
    folderId: string,
    parentId: string | null,
    name: string,
  ) => {
    if (!name.trim()) return;

    try {
      await client(`${apiPrefix}/folders/${folderId}`, {
        method: "PUT",
        body: { name, parent_id: parentId },
      });
      await Promise.all([loadInitial(), refreshFoldersTree()]);
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
      // On est sur une page fixe (plus d'accumulation façon scroll
      // infini) : après upload, on recharge simplement la page
      // courante pour refléter l'état réel côté serveur (compteur
      // total, tri, etc.) plutôt que de préfixer localement.
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
      // Le média quitte potentiellement la vue courante (déplacé hors
      // du dossier affiché) : un simple refetch de la page suffit à
      // refléter ça, pas besoin de logique spécifique.
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

  // Appel DELETE "brut", sans refetch ni toast — partagé par la
  // suppression unitaire et la suppression groupée, pour éviter que
  // deleteSelectedMedias ne déclenche N refetch et N toasts.
  const deleteMediaRequest = (id: string) =>
    client(`${apiPrefix}/medias/${id}`, { method: "DELETE" });

  const deleteMedia = async (id: string) => {
    try {
      await deleteMediaRequest(id);
      selectedMediaIds.value = selectedMediaIds.value.filter(
        (mediaId) => mediaId !== id,
      );
      // Recharge la page courante : si c'était le seul élément de la
      // page, `meta.last_page` peut avoir changé côté serveur.
      await fetchMedias(page.value);
      toast.add({
        title: "Succès",
        description: "Media supprimé avec succès",
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

  // Sélection multiple, utilisée par la page dédiée pour la suppression
  // groupée (pas de vraie route "bulk delete" côté API : on enchaîne les
  // appels DELETE individuels en parallèle).
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

  const deleteSelectedMedias = async () => {
    const ids = [...selectedMediaIds.value];
    if (!ids.length) return;

    const results = await Promise.allSettled(
      ids.map((id) => deleteMediaRequest(id)),
    );
    const failedCount = results.filter((r) => r.status === "rejected").length;

    clearMediaSelection();
    await fetchMedias(page.value);

    if (failedCount) {
      toast.add({
        title: "Suppression partielle",
        description: `${failedCount} élément(s) n'ont pas pu être supprimés.`,
        color: "warning",
      });
    } else {
      toast.add({
        title: "Succès",
        description: `${ids.length} média(s) supprimé(s) avec succès`,
        color: "success",
      });
    }
  };

  // La navigation efface la sélection en cours : une sélection qui traverse
  // deux dossiers différents n'a pas de sens pour l'utilisateur.
  watch(currentFolderId, clearMediaSelection);

  return {
    // état
    searchQuery,
    currentFolderId,
    breadcrumb,
    folders,
    medias,
    page,
    lastPage,
    total,
    pending,
    foldersTree,
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
    createFolder,
    deleteFolder,
    renameFolder,
    uploadFiles,
    moveMedia,
    deleteMedia,
    refreshFoldersTree,
    toggleMediaSelection,
    clearMediaSelection,
    toggleSelectAllOnPage,
    deleteSelectedMedias,
  };
}

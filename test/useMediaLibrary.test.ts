import { beforeEach, describe, expect, it } from "vitest";
import { useMediaLibrary } from "../composables/useMediaLibrary";
import { mockClient, resetNuxtStubs, toastAdd } from "./nuxtStubs";

beforeEach(() => {
  resetNuxtStubs();
});

describe("useMediaLibrary", () => {
  it("loadInitial populates state from the server response", async () => {
    mockClient.mockResolvedValueOnce({
      folders: [{ id: "f1", name: "Photos" }],
      data: [{ id: "m1", name: "a.jpg" }],
      meta: { current_page: 1, last_page: 3, total: 50 },
      breadcrumb: [],
    });

    const lib = useMediaLibrary();
    await lib.loadInitial();

    expect(mockClient).toHaveBeenCalledWith(
      "api/admin/medias",
      expect.objectContaining({ query: expect.objectContaining({ page: 1 }) }),
    );
    expect(lib.medias.value).toHaveLength(1);
    expect(lib.folders.value).toHaveLength(1);
    expect(lib.lastPage.value).toBe(3);
    expect(lib.total.value).toBe(50);
    expect(lib.pending.value).toBe(false);
  });

  it("ignores a stale response when a newer request already resolved (race condition guard)", async () => {
    let resolveFirst!: (value: unknown) => void;
    const firstResponsePromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    mockClient
      .mockImplementationOnce(() => firstResponsePromise) // page 1 : ne résout pas tout de suite
      .mockResolvedValueOnce({
        data: [{ id: "m-new", name: "new.jpg" }],
        meta: { current_page: 2, last_page: 2, total: 2 },
        folders: [],
        breadcrumb: [],
      }); // page 2 : résout immédiatement

    const lib = useMediaLibrary();

    const firstCall = lib.goToPage(1);
    const secondCall = lib.goToPage(2);
    await secondCall;

    // La requête "page 1" ne se termine qu'après que "page 2" a déjà mis à
    // jour l'état : elle ne doit pas écraser le résultat le plus récent.
    resolveFirst({
      data: [{ id: "m-old", name: "old.jpg" }],
      meta: { current_page: 1, last_page: 2, total: 2 },
      folders: [],
      breadcrumb: [],
    });
    await firstCall;

    expect(lib.medias.value.map((m) => m.id)).toEqual(["m-new"]);
    expect(lib.page.value).toBe(2);
  });

  it("tracks bulk selection state (toggle, select all, clear)", async () => {
    mockClient.mockResolvedValueOnce({
      data: [{ id: "a" }, { id: "b" }, { id: "c" }],
      meta: { current_page: 1, last_page: 1, total: 3 },
      folders: [],
      breadcrumb: [],
    });

    const lib = useMediaLibrary();
    await lib.loadInitial();

    expect(lib.isAllSelected.value).toBe(false);

    lib.toggleMediaSelection("a");
    lib.toggleMediaSelection("b");
    expect(lib.selectedMediaIds.value).toEqual(["a", "b"]);
    expect(lib.isAllSelected.value).toBe(false);

    lib.toggleSelectAllOnPage();
    expect(lib.selectedMediaIds.value).toEqual(["a", "b", "c"]);
    expect(lib.isAllSelected.value).toBe(true);

    lib.toggleSelectAllOnPage();
    expect(lib.selectedMediaIds.value).toEqual([]);
  });

  it("deleteSelectedMedias shows a partial-failure warning and clears the selection", async () => {
    mockClient
      .mockResolvedValueOnce({
        data: [{ id: "a" }, { id: "b" }],
        meta: { current_page: 1, last_page: 1, total: 2 },
        folders: [],
        breadcrumb: [],
      }) // loadInitial
      .mockResolvedValueOnce({
        deleted_count: 1,
        failures: [{ id: "b", name: "b.jpg", reason: "Ce média est attaché." }],
      }) // bulk-delete
      .mockResolvedValueOnce({
        data: [{ id: "a" }],
        meta: { current_page: 1, last_page: 1, total: 1 },
        folders: [],
        breadcrumb: [],
      }); // refetch après l'action groupée

    const lib = useMediaLibrary();
    await lib.loadInitial();
    lib.toggleMediaSelection("a");
    lib.toggleMediaSelection("b");

    await lib.deleteSelectedMedias();

    expect(mockClient).toHaveBeenNthCalledWith(
      2,
      "api/admin/medias/bulk-delete",
      expect.objectContaining({ method: "POST", body: { media_ids: ["a", "b"] } }),
    );
    expect(lib.selectedMediaIds.value).toEqual([]);
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Mise à la corbeille partielle", color: "warning" }),
    );
  });

  it("deleteSelectedMedias shows a success toast when every item is processed", async () => {
    mockClient
      .mockResolvedValueOnce({
        data: [{ id: "a" }],
        meta: { current_page: 1, last_page: 1, total: 1 },
        folders: [],
        breadcrumb: [],
      }) // loadInitial
      .mockResolvedValueOnce({ deleted_count: 1, failures: [] }) // bulk-delete
      .mockResolvedValueOnce({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0 },
        folders: [],
        breadcrumb: [],
      }); // refetch

    const lib = useMediaLibrary();
    await lib.loadInitial();
    lib.toggleMediaSelection("a");

    await lib.deleteSelectedMedias();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Succès", description: "1 média(s) mis à la corbeille", color: "success" }),
    );
  });

  it("createFolder surfaces the server validation error and rethrows", async () => {
    mockClient.mockRejectedValueOnce({
      data: { errors: { name: ["Ce nom de dossier existe déjà à cet emplacement."] } },
    });

    const lib = useMediaLibrary();

    await expect(lib.createFolder("Photos")).rejects.toBeTruthy();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Erreur",
        description: "Ce nom de dossier existe déjà à cet emplacement.",
        color: "error",
      }),
    );
  });
});

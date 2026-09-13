import { beforeEach, describe, expect, it } from "vitest";
import { useMediaFolderTree } from "../composables/useMediaFolderTree";
import { mockClient, resetNuxtStubs } from "./nuxtStubs";

beforeEach(() => {
  resetNuxtStubs();
});

describe("useMediaFolderTree", () => {
  it("fetches the root level (no parent_id) and caches the result", async () => {
    mockClient.mockResolvedValueOnce({ data: [{ id: "f1", name: "Photos" }] });

    const tree = useMediaFolderTree();
    expect(tree.getChildren(null)).toBeUndefined();

    const result = await tree.fetchChildren(null);

    expect(mockClient).toHaveBeenCalledWith("api/admin/folders", { query: {} });
    expect(result).toHaveLength(1);
    expect(tree.getChildren(null)).toEqual(result);

    // Un second appel ne doit pas refaire de requête : la valeur est en cache.
    await tree.fetchChildren(null);
    expect(mockClient).toHaveBeenCalledTimes(1);
  });

  it("fetches a given parent's direct children using parent_id", async () => {
    mockClient.mockResolvedValueOnce({ data: [{ id: "f2", name: "Invoices" }] });

    const tree = useMediaFolderTree();
    await tree.fetchChildren("f1");

    expect(mockClient).toHaveBeenCalledWith("api/admin/folders", { query: { parent_id: "f1" } });
    expect(tree.getChildren("f1")).toEqual([{ id: "f2", name: "Invoices" }]);
    // Un autre niveau (racine) reste bien un cache distinct, non chargé.
    expect(tree.getChildren(null)).toBeUndefined();
  });

  it("reports isLoading only while the request for that level is in flight", async () => {
    let resolveFetch!: (value: unknown) => void;
    mockClient.mockImplementationOnce(
      () => new Promise((resolve) => { resolveFetch = resolve; }),
    );

    const tree = useMediaFolderTree();
    expect(tree.isLoading(null)).toBe(false);

    const pending = tree.fetchChildren(null);
    expect(tree.isLoading(null)).toBe(true);

    resolveFetch({ data: [] });
    await pending;

    expect(tree.isLoading(null)).toBe(false);
  });

  it("invalidate forces the next fetchChildren call to hit the server again", async () => {
    mockClient
      .mockResolvedValueOnce({ data: [{ id: "f1", name: "Old name" }] })
      .mockResolvedValueOnce({ data: [{ id: "f1", name: "New name" }] });

    const tree = useMediaFolderTree();
    await tree.fetchChildren(null);
    tree.invalidate(null);

    const result = await tree.fetchChildren(null);

    expect(mockClient).toHaveBeenCalledTimes(2);
    expect(result[0].name).toBe("New name");
  });

  it("refresh invalidates then immediately refetches a level", async () => {
    mockClient
      .mockResolvedValueOnce({ data: [{ id: "f1", name: "Documents" }] })
      .mockResolvedValueOnce({ data: [{ id: "f1", name: "Documents" }, { id: "f2", name: "New folder" }] });

    const tree = useMediaFolderTree();
    await tree.fetchChildren(null);

    const refreshed = await tree.refresh(null);

    expect(mockClient).toHaveBeenCalledTimes(2);
    expect(refreshed).toHaveLength(2);
    expect(tree.getChildren(null)).toHaveLength(2);
  });
});

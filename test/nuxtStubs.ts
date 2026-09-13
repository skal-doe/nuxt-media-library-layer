import { computed, ref, watch } from "vue";
import { vi } from "vitest";

/**
 * Les composables du layer (useMediaLibrary, useConfirmAction,
 * useMediaFolderTree...) s'appuient sur des globales injectées par
 * l'auto-import de Nuxt (ref, computed, watch, useRuntimeConfig,
 * useToast...) sans jamais les importer explicitement — c'est le contrat
 * normal d'un layer Nuxt.
 *
 * Pour les tester sans démarrer une vraie application Nuxt (lourd, et ce
 * layer n'en a pas une à lui), on injecte ces mêmes noms sur `globalThis`.
 * Une identifiant non déclaré se résout via l'objet global en JS/Node, donc
 * un `ref(...)` non importé dans useMediaLibrary.ts retrouvera bien celui-ci.
 */

export const toastAdd = vi.fn();
export const mockClient = vi.fn();

export function installNuxtStubs() {
  Object.assign(globalThis, {
    ref,
    computed,
    watch,
    onMounted: (fn: () => void) => fn(),
    useToast: () => ({ add: toastAdd }),
    useRuntimeConfig: () => ({
      public: {
        mediaLibraryApiPrefix: "api/admin",
        mediaLibraryAcceptedMimes: "jpeg,jpg,png,gif,webp,svg",
        mediaLibraryMaxFileSize: 2048,
      },
    }),
    useMediaLibraryClient: () => mockClient,
  });
}

export function resetNuxtStubs() {
  mockClient.mockReset();
  toastAdd.mockReset();
}

import { defineConfig } from "vitest/config";

/**
 * Ce layer n'a pas d'application Nuxt propre : les composables testés ici
 * s'appuient sur des globales injectées par l'auto-import de Nuxt (ref,
 * computed, watch, useRuntimeConfig, useToast...). Plutôt que de démarrer un
 * vrai environnement Nuxt (lourd, nécessite une app hôte), les tests stubent
 * ces globales dans test/setup.ts — cf. ce fichier pour le détail.
 */
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
  },
});

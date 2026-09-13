export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      mediaLibraryApiPrefix: "api/admin",
      // Doivent rester alignés avec config/media-library.php côté Laravel
      // (accepted_mimes, max_file_size) — le projet consommateur peut les
      // surcharger dans son propre nuxt.config.ts si sa config diffère.
      mediaLibraryAcceptedMimes: "jpeg,jpg,png,gif,webp,svg",
      mediaLibraryMaxFileSize: 2048, // Ko
    },
  },
});
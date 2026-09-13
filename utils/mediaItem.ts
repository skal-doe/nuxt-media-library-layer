import type { MediaFieldValue, MediaPickerItem } from "../types";

/**
 * Un élément de champ média peut être soit une simple URL (rétrocompatibilité
 * avec d'anciens formulaires), soit un objet { id, url, name, mime_type? }.
 * Ces helpers centralisent la lecture de ces deux formes pour éviter que
 * chaque composant (FormFileUploadBox, FormMediaGallery...) ne réimplémente
 * sa propre détection.
 */
type MediaItemLike = MediaFieldValue | MediaPickerItem;

const IMAGE_EXTENSIONS = /\.(jpeg|jpg|gif|png|webp|svg|bmp)$/;

export function getItemUrl(item: MediaItemLike): string {
  if (!item) return "";
  return typeof item === "string" ? item : item.url ?? "";
}

export function getItemName(item: MediaItemLike): string {
  if (!item) return "";
  if (typeof item === "object" && item.name) return item.name;

  const url = getItemUrl(item);
  const parts = url.split("/");
  return parts[parts.length - 1] || "Média";
}

export function isImageItem(item: MediaItemLike): boolean {
  if (!item) return false;
  if (typeof item === "object" && item.mime_type) {
    return item.mime_type.startsWith("image/");
  }

  const url = getItemUrl(item).split("?")[0].toLowerCase();
  return IMAGE_EXTENSIONS.test(url);
}

/**
 * Vérifie qu'un mime_type correspond à un filtre au format `accept` HTML
 * (ex: "image/*", "image/png,application/pdf", ".jpg,.png"). Un `accept`
 * vide ou absent laisse tout passer. Un mime_type inconnu ne matche jamais
 * un filtre défini, par prudence (mieux vaut masquer que laisser fuiter).
 */
export function matchesAccept(
  mimeType: string | null | undefined,
  accept?: string | null,
): boolean {
  if (!accept || !accept.trim()) return true;
  if (!mimeType) return false;

  const patterns = accept
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  const mime = mimeType.toLowerCase();

  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) return false; // extensions non applicables aux médias déjà en base
    if (pattern.endsWith("/*")) return mime.startsWith(pattern.slice(0, -1));
    return mime === pattern;
  });
}

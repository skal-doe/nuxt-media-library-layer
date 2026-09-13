export interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface MediaFolder extends Timestamps {
  id: string;
  name: string;
  parent_id?: string | null;
  children?: MediaFolder[];
  folder_count?: number;
  medias_count?: number;
  total_items?: number;
}

export interface MediaUsage {
  type: string;
  id: string;
  name: string;
  collection: string | null;
}

export interface Media extends Timestamps {
  id: string;
  url: string;
  name: string;
  size: string;
  file_size?: number | null;
  disk?: string;
  mime_type: string;
  is_private?: boolean;
  temporary_url?: string;
  folder_id?: string | null;
  folder?: MediaFolder;
  deleted_at?: string | null;
  collection?: string | null;
  collections?: string[];
  usages: MediaUsage[];
  is_attached: boolean;
  uploaded_by?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

/**
 * Forme réduite d'un `Media` telle que conservée dans un champ de formulaire
 * (avatar, galerie...) une fois sélectionné via le picker. On y garde le strict
 * nécessaire pour l'affichage (aperçu, nom) sans trainer toute la ressource API.
 */
export interface MediaPickerItem {
  id: string;
  url: string;
  name: string;
  mime_type?: string;
}

/** Valeur d'un champ de formulaire "média unique" (avatar, thumbnail...). */
export type MediaFieldValue = MediaPickerItem | string | null;

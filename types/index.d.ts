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
  mime_type: string;
  usages: MediaUsage[];
  is_attached: boolean;
  uploaded_by?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

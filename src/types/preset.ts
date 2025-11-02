import { DesignElement } from './design';

export interface Preset {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  elements: DesignElement[];
  thumbnail?: string;
  element_count: number;
  created_at: string;
  updated_at: string;
}

export interface PresetCreateInput {
  name: string;
  description?: string;
  elements: DesignElement[];
  thumbnail?: string;
  element_count: number;
}

export interface PresetUpdateInput {
  name?: string;
  description?: string;
  elements?: DesignElement[];
  thumbnail?: string;
  element_count?: number;
}

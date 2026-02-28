export type NGOStatus = 'draft' | 'active' | 'inactive';

export interface NGO {
  id: string;
  name: string;
  mission: string;
  description?: string;
  causes: string[];
  needs: string[];
  region?: string;
  status: NGOStatus;
  creator_id: string;
  parent_id?: string | null;
  logo_url?: string;
  website_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface NGOCreateInput {
  name: string;
  mission: string;
  description?: string;
  causes: string[];
  needs: string[];
  region?: string;
}

export interface NGOUpdateInput extends Partial<NGOCreateInput> {
  status?: NGOStatus;
}

export type OrganizationType = 'club' | 'ngo';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  mission: string | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  region: string | null;
  parent_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrgUnitType {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
}

export interface OrgUnit {
  id: string;
  org_id: string;
  type_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface OrgRole {
  id: string;
  org_id: string;
  name: string;
  permissions: string[];
  is_admin: boolean;
  created_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role_id: string | null;
  unit_id: string | null;
  status: string;
  engagement_points: number;
  joined_at: string | null;
  created_at: string;
}

export interface OrgEvent {
  id: string;
  org_id: string;
  unit_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface OrgPost {
  id: string;
  org_id: string;
  unit_id: string | null;
  author_id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

import supabase from '../../../utils/supabase';
import type { Organization, OrganizationType } from '../../../types/organization';

export async function createOrganization(input: Partial<Organization> & { name: string; type: OrganizationType }): Promise<Organization> {
  const { data, error } = await supabase
    .from('orgs')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('orgs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getAllOrganizations(type?: OrganizationType): Promise<Organization[]> {
  let query = supabase.from('orgs').select('*');
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getOrganizationsByParentId(parentId: string): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('orgs')
    .select('*')
    .eq('parent_id', parentId)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
  const { data, error } = await supabase
    .from('orgs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOrganization(id: string): Promise<void> {
  const { error } = await supabase
    .from('orgs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

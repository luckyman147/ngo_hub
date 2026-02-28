import supabase from '../../../utils/supabase';
import type { OrgRole } from '../../../types/organization';

export async function createOrgRole(orgId: string, name: string, permissions: string[] = [], isAdmin: boolean = false): Promise<OrgRole> {
  const { data, error } = await supabase
    .from('org_roles')
    .insert({
      org_id: orgId,
      name,
      permissions,
      is_admin: isAdmin
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrgRoles(orgId: string): Promise<OrgRole[]> {
  const { data, error } = await supabase
    .from('org_roles')
    .select('*')
    .eq('org_id', orgId)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function updateOrgRole(roleId: string, updates: Partial<OrgRole>): Promise<OrgRole> {
  const { data, error } = await supabase
    .from('org_roles')
    .update(updates)
    .eq('id', roleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOrgRole(roleId: string): Promise<void> {
  const { error } = await supabase
    .from('org_roles')
    .delete()
    .eq('id', roleId);

  if (error) throw error;
}

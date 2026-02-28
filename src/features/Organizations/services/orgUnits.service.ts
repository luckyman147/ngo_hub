import supabase from '../../../utils/supabase';
import type { OrgUnit, OrgUnitType } from '../../../types/organization';

export async function createOrgUnitType(orgId: string, name: string): Promise<OrgUnitType> {
  const { data, error } = await supabase
    .from('org_unit_types')
    .insert({ org_id: orgId, name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createOrgUnit(orgId: string, typeId: string, name: string, parentId?: string): Promise<OrgUnit> {
  const { data, error } = await supabase
    .from('org_units')
    .insert({
      org_id: orgId,
      type_id: typeId,
      name,
      parent_id: parentId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrgUnits(orgId: string): Promise<OrgUnit[]> {
  const { data, error } = await supabase
    .from('org_units')
    .select('*, org_unit_types(*)')
    .eq('org_id', orgId);

  if (error) throw error;
  return data ?? [];
}

export async function getOrgUnitTypes(orgId: string): Promise<OrgUnitType[]> {
  const { data, error } = await supabase
    .from('org_unit_types')
    .select('*')
    .eq('org_id', orgId);

  if (error) throw error;
  return data ?? [];
}

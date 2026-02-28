import supabase from '../../../utils/supabase';

export interface NGOUnitType {
    id: string;
    ngo_id: string;
    name: string;
    level: number;
    icon?: string;
}

export interface NGOUnit {
    id: string;
    ngo_id: string;
    unit_type_id: string;
    parent_unit_id?: string | null;
    name: string;
    description?: string;
    created_at: string;
    unit_type?: NGOUnitType;
    children?: NGOUnit[];
}

// ── Unit Types ──────────────────────────────────────

export async function getUnitTypes(ngoId: string): Promise<NGOUnitType[]> {
    const { data, error } = await supabase
        .from('ngo_unit_types')
        .select('*')
        .eq('ngo_id', ngoId)
        .order('level', { ascending: true });
    if (error) throw error;
    return data ?? [];
}

export async function createUnitType(ngoId: string, name: string, level: number, icon?: string) {
    const { data, error } = await supabase
        .from('ngo_unit_types')
        .insert({ ngo_id: ngoId, name, level, icon: icon ?? null })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteUnitType(id: string) {
    const { error } = await supabase.from('ngo_unit_types').delete().eq('id', id);
    if (error) throw error;
}

// ── Units (instances) ───────────────────────────────

export async function getUnits(ngoId: string): Promise<NGOUnit[]> {
    const { data, error } = await supabase
        .from('ngo_units')
        .select('*, unit_type:ngo_unit_types(*)')
        .eq('ngo_id', ngoId)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
}

/** Returns a nested tree structure from flat units list */
export function buildUnitTree(units: NGOUnit[]): NGOUnit[] {
    const map = new Map<string, NGOUnit>();
    const roots: NGOUnit[] = [];

    units.forEach((u) => map.set(u.id, { ...u, children: [] }));
    units.forEach((u) => {
        const node = map.get(u.id)!;
        if (u.parent_unit_id && map.has(u.parent_unit_id)) {
            map.get(u.parent_unit_id)!.children!.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}

export async function createUnit(ngoId: string, unitTypeId: string, name: string, parentUnitId?: string, description?: string) {
    const { data, error } = await supabase
        .from('ngo_units')
        .insert({
            ngo_id: ngoId,
            unit_type_id: unitTypeId,
            parent_unit_id: parentUnitId ?? null,
            name,
            description: description ?? null,
        })
        .select('*, unit_type:ngo_unit_types(*)')
        .single();
    if (error) throw error;
    return data;
}

export async function deleteUnit(id: string) {
    const { error } = await supabase.from('ngo_units').delete().eq('id', id);
    if (error) throw error;
}

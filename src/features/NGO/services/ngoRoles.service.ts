import supabase from '../../../utils/supabase';

export interface NGORole {
    id: string;
    ngo_id: string;
    name: string;
    permissions: string[];
    is_admin: boolean;
    color: string;
    sort_order: number;
}

export const ALL_PERMISSIONS = [
    { key: 'manage_members', label: 'Manage Members', desc: 'Invite, remove, and approve members' },
    { key: 'manage_roles', label: 'Manage Roles', desc: 'Create, edit roles & assign to members' },
    { key: 'manage_units', label: 'Manage Units', desc: 'Create, edit, delete org units' },
    { key: 'create_events', label: 'Create Events', desc: 'Create org events' },
    { key: 'manage_events', label: 'Manage Events', desc: 'Edit/delete any event' },
    { key: 'create_posts', label: 'Create Posts', desc: 'Post in community feed' },
    { key: 'moderate_posts', label: 'Moderate Posts', desc: 'Pin/delete any post' },
    { key: 'view_analytics', label: 'View Analytics', desc: 'Access dashboard & stats' },
    { key: 'manage_org', label: 'Manage Organization', desc: 'Edit org settings' },
    { key: 'all', label: 'Full Access', desc: 'All permissions' },
] as const;

export async function getRoles(ngoId: string): Promise<NGORole[]> {
    const { data, error } = await supabase
        .from('ngo_roles')
        .select('*')
        .eq('ngo_id', ngoId)
        .order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
}

export async function createRole(ngoId: string, name: string, permissions: string[], isAdmin = false, color = '#6B7280') {
    const { data, error } = await supabase
        .from('ngo_roles')
        .insert({ ngo_id: ngoId, name, permissions, is_admin: isAdmin, color })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateRole(id: string, updates: Partial<Pick<NGORole, 'name' | 'permissions' | 'is_admin' | 'color' | 'sort_order'>>) {
    const { data, error } = await supabase
        .from('ngo_roles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteRole(id: string) {
    const { error } = await supabase.from('ngo_roles').delete().eq('id', id);
    if (error) throw error;
}

import supabase from '../../../utils/supabase';

export interface NGOMember {
    id: string;
    ngo_id: string;
    member_id: string;
    role_id?: string;
    unit_id?: string;
    status: 'pending' | 'accepted' | 'rejected';
    engagement_points: number;
    joined_at?: string;
    created_at: string;
    profile?: { fullname?: string; email?: string; avatar_url?: string };
    role?: { name: string; color: string; is_admin: boolean; permissions: string[] };
    unit?: { name: string };
}

export async function getMembers(ngoId: string): Promise<NGOMember[]> {
    const { data, error } = await supabase
        .from('ngo_members')
        .select('*, profile:profiles!member_id(fullname, email, avatar_url), role:ngo_roles(name, color, is_admin, permissions), unit:ngo_units(name)')
        .eq('ngo_id', ngoId)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
}

export async function requestJoinNGO(ngoId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('ngo_members')
        .insert({ ngo_id: ngoId, member_id: user.id, status: 'pending' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function approveMember(id: string) {
    const { error } = await supabase
        .from('ngo_members')
        .update({ status: 'accepted', joined_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw error;
}

export async function rejectMember(id: string) {
    const { error } = await supabase.from('ngo_members').delete().eq('id', id);
    if (error) throw error;
}

export async function assignRole(id: string, roleId: string) {
    const { error } = await supabase
        .from('ngo_members')
        .update({ role_id: roleId })
        .eq('id', id);
    if (error) throw error;
}

export async function assignUnit(id: string, unitId: string | null) {
    const { error } = await supabase
        .from('ngo_members')
        .update({ unit_id: unitId })
        .eq('id', id);
    if (error) throw error;
}

export async function removeMember(id: string) {
    const { error } = await supabase.from('ngo_members').delete().eq('id', id);
    if (error) throw error;
}

export async function getMyNGOs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('ngo_members')
        .select('ngo_id, status, ngo:ngos(id, name, mission, logo_url)')
        .eq('member_id', user.id)
        .eq('status', 'accepted');
    if (error) throw error;
    return (data ?? []).map((d: any) => ({ ngo_id: d.ngo_id, status: d.status, ngo: Array.isArray(d.ngo) ? d.ngo[0] : d.ngo }));
}

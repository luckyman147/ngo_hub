import supabase from "../../../utils/supabase";

export interface ClubDepartment {
    id: string;
    club_id: string;
    name: string;
    description?: string;
    created_by: string;
    created_at: string;
    member_count?: number;
    pending_count?: number;
    members?: DepartmentMember[];
}

export interface DepartmentMember {
    id: string;
    department_id: string;
    member_id: string;
    role: 'member' | 'head';
    status: 'pending' | 'accepted';
    created_at: string;
    profile?: { fullname?: string; email?: string; avatar_url?: string };
}

export async function getDepartments(clubId: string): Promise<ClubDepartment[]> {
    const { data, error } = await supabase
        .from("club_departments")
        .select("*, members:club_department_members(*)")
        .eq("club_id", clubId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((d: any) => ({
        ...d,
        member_count: d.members?.filter((m: any) => m.status === 'accepted').length ?? 0,
        pending_count: d.members?.filter((m: any) => m.status === 'pending').length ?? 0,
    }));
}

export async function createDepartment(clubId: string, name: string, description?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("club_departments")
        .insert({ club_id: clubId, name, description: description ?? null, created_by: user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateDepartment(id: string, updates: { name?: string; description?: string }) {
    const { data, error } = await supabase
        .from("club_departments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteDepartment(id: string) {
    const { error } = await supabase.from("club_departments").delete().eq("id", id);
    if (error) throw error;
}

export async function requestJoinDepartment(departmentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("club_department_members")
        .insert({ department_id: departmentId, member_id: user.id, status: 'pending', role: 'member' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function approveDeptMember(id: string) {
    const { data, error } = await supabase
        .from("club_department_members")
        .update({ status: 'accepted' })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function rejectDeptMember(id: string) {
    const { error } = await supabase.from("club_department_members").delete().eq("id", id);
    if (error) throw error;
}

export async function setDeptMemberRole(id: string, role: 'member' | 'head') {
    const { data, error } = await supabase
        .from("club_department_members")
        .update({ role })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function removeDeptMember(id: string) {
    const { error } = await supabase.from("club_department_members").delete().eq("id", id);
    if (error) throw error;
}

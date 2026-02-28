import supabase from '../../../utils/supabase';
import type { OrgMember } from '../../../types/organization';

export async function joinOrganization(orgId: string, userId: string, roleId?: string): Promise<OrgMember> {
  const { data, error } = await supabase
    .from('org_members')
    .insert({
      org_id: orgId,
      user_id: userId,
      role_id: roleId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from('org_members')
    .select('*, profiles(*)')
    .eq('org_id', orgId);

  if (error) throw error;
  return data ?? [];
}

export async function updateMemberStatus(memberId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('org_members')
    .update({ status })
    .eq('id', memberId);

  if (error) throw error;
}

export async function addEngagementPoints(memberId: string, points: number): Promise<void> {
  const { error } = await supabase.rpc('increment_engagement_points', {
    member_id: memberId,
    points_to_add: points
  });

  if (error) {
    // Fallback if RPC doesn't exist yet, though we should probably add it to SQL
    const { data: current } = await supabase
      .from('org_members')
      .select('engagement_points')
      .eq('id', memberId)
      .single();
    
    const { error: updateError } = await supabase
      .from('org_members')
      .update({ engagement_points: (current?.engagement_points ?? 0) + points })
      .eq('id', memberId);
    
    if (updateError) throw updateError;
  }
}

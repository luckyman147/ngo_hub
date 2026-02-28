import supabase from "../../../utils/supabase";
import type { Club, ClubRole, ClubMember } from "../types";

export async function getClubs(): Promise<Club[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!clubs?.length) return [];
  const clubIds = clubs.map((c: any) => c.id);

  let myMemberships: {
    club_id: string;
    status: string;
    club_role?: ClubRole;
  }[] = [];
  if (user) {
    const { data: mems } = await supabase
      .from("club_members")
      .select("club_id, status, club_roles(*)")
      .eq("member_id", user.id)
      .in("club_id", clubIds);
    myMemberships = (mems ?? []).map((m: any) => ({
      club_id: m.club_id,
      status: m.status,
      club_role: Array.isArray(m.club_roles) ? m.club_roles[0] : m.club_roles,
    }));
  }

  // Fetch accepted member counts
  const { data: memberCounts } = await supabase
    .from("club_members")
    .select("club_id")
    .eq("status", "accepted")
    .in("club_id", clubIds);
  const countByClub: Record<string, number> = {};
  (memberCounts ?? []).forEach((r: any) => {
    countByClub[r.club_id] = (countByClub[r.club_id] ?? 0) + 1;
  });

  return clubs.map((c: any) => {
    const mem = myMemberships.find((m: any) => m.club_id === c.id);
    return {
      ...c,
      member_count: countByClub[c.id] ?? 0,
      is_member: !!mem,
      my_status: mem?.status,
      my_role: mem?.club_role,
    };
  });
}

export async function getClubById(id: string): Promise<Club | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: club, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !club) return null;

  const { data: members } = await supabase
    .from("club_members")
    .select("*, club_role:club_roles(*), is_board_member")
    .eq("club_id", id);

  let myMembership: {
    status: string;
    club_role: ClubRole;
    is_board_member: boolean;
  } | null = null;
  if (user) {
    const { data: m } = await supabase
      .from("club_members")
      .select("status, is_board_member, club_role:club_roles(*)")
      .eq("club_id", id)
      .eq("member_id", user.id)
      .maybeSingle();
    if (m) myMembership = m as any;
  }

  const { count } = await supabase
    .from("club_members")
    .select("*", { count: "exact", head: true })
    .eq("club_id", id)
    .eq("status", "accepted");

  return {
    ...club,
    member_count: count ?? 0,
    is_member: !!myMembership,
    my_status: myMembership?.status ?? undefined,
    my_role: myMembership?.club_role,
    my_is_board_member:
      myMembership?.status === "accepted" &&
      myMembership?.is_board_member === true,
    members: members,
  } as Club & { members?: ClubMember[]; my_is_board_member?: boolean };
}

export async function createClub(input: {
  name: string;
  description?: string;
  region?: string;
}): Promise<Club> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("clubs")
    .insert({
      name: input.name,
      description: input.description ?? null,
      region: input.region ?? null,
      president_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClub(
  id: string,
  input: {
    name: string;
    description?: string;
    region?: string;
    logo_url?: string;
  },
): Promise<Club> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("clubs")
    .update({
      name: input.name,
      description: input.description ?? null,
      region: input.region ?? null,
      logo_url: input.logo_url ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function requestToJoinClub(
  clubId: string,
  message?: string,
): Promise<ClubMember> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("club_members")
    .insert({
      club_id: clubId,
      member_id: user.id,
      status: "pending",
      message: message ?? null,
    })
    .select("*, club_role:club_roles(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function approveMember(
  clubId: string,
  memberId: string,
  roleId?: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updates: Record<string, unknown> = {
    status: "accepted",
    joined_at: new Date().toISOString(),
  };
  if (roleId) updates.club_role_id = roleId;

  const { error } = await supabase
    .from("club_members")
    .update(updates)
    .eq("club_id", clubId)
    .eq("member_id", memberId);

  if (error) throw error;
}

export async function rejectMember(
  clubId: string,
  memberId: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("club_members")
    .delete()
    .eq("club_id", clubId)
    .eq("member_id", memberId);

  if (error) throw error;
}

export async function assignMemberRole(
  clubId: string,
  memberId: string,
  roleId: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("club_members")
    .update({ club_role_id: roleId })
    .eq("club_id", clubId)
    .eq("member_id", memberId);

  if (error) throw error;
}

export async function getClubRoles(clubId: string): Promise<ClubRole[]> {
  const { data, error } = await supabase
    .from("club_roles")
    .select("*")
    .eq("club_id", clubId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createClubRole(
  clubId: string,
  name: string,
): Promise<ClubRole> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("club_roles")
    .insert({ club_id: clubId, name, is_president: false })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setBoardMember(
  clubId: string,
  memberId: string,
  isBoardMember: boolean,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: club } = await supabase
    .from("clubs")
    .select("president_id")
    .eq("id", clubId)
    .single();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle();
  const isSuperAdmin = profile?.is_superadmin === true;
  if (!club || (club.president_id !== user.id && !isSuperAdmin))
    throw new Error("Only the president can assign board member access");

  const { error } = await supabase
    .from("club_members")
    .update({ is_board_member: isBoardMember })
    .eq("club_id", clubId)
    .eq("member_id", memberId);

  if (error) throw error;
}

export async function isSuperAdmin(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle();
  return data?.is_superadmin === true;
}

import supabase from "../../../utils/supabase";
import type { Member } from "../../Members/types";
import type {
  Mission,
  MissionRecommendation,
  ProfileMatch,
  CreateMissionDTO,
  UpdateMissionDTO,
  SubmitFeedbackDTO,
  RecommendationStatus,
} from "../types";
import { computeMatchScore, rankMembersForMission } from "./scoring";

// ─── Missions CRUD ────────────────────────────────────────────────────────────

export async function getMissions(): Promise<Mission[]> {
  const { data, error } = await supabase
    .from("missions")
    .select("*, organization:organization_id(id, name, logo_url)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Mission[];
}

export async function getMissionById(id: string): Promise<Mission | null> {
  const { data, error } = await supabase
    .from("missions")
    .select("*, organization:organization_id(id, name, logo_url)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Mission;
}

export async function getMissionsByCreator(userId: string): Promise<Mission[]> {
  const { data, error } = await supabase
    .from("missions")
    .select("*, organization:organization_id(id, name, logo_url)")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Mission[];
}

export async function createMission(dto: CreateMissionDTO): Promise<Mission> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("missions")
    .insert({
      title: dto.title,
      description: dto.description ?? null,
      category: dto.category ?? null,
      required_skills: dto.required_skills ?? [],
      personality_fit: dto.personality_fit ?? [],
      schedule_days: dto.schedule_days ?? [],
      schedule_time: dto.schedule_time ?? null,
      duration_weeks: dto.duration_weeks ?? 4,
      points_reward: dto.points_reward ?? 0,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Mission;
}

export async function updateMission(
  id: string,
  dto: UpdateMissionDTO,
): Promise<Mission> {
  const { data, error } = await supabase
    .from("missions")
    .update({
      ...dto,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Mission;
}

export async function deleteMission(id: string): Promise<void> {
  // Soft delete — just mark inactive
  const { error } = await supabase
    .from("missions")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ─── Member-side: getUserRecommendations ──────────────────────────────────────

/**
 * Fetches all active missions, computes compatibility scores for the given
 * member, upserts the results into mission_recommendations, and returns the
 * list sorted by score descending (excluding 'refused' by default).
 */
export async function getUserRecommendations(
  member: Member,
  options: { includeRefused?: boolean } = {},
): Promise<MissionRecommendation[]> {
  const { includeRefused = false } = options;

  // 1. Load all active missions
  const missions = await getMissions();
  if (missions.length === 0) return [];

  // 2. Load existing recommendations for this member so we don't overwrite
  //    manually-set statuses (accepted / refused)
  const { data: existing } = await supabase
    .from("mission_recommendations")
    .select("mission_id, status, feedback")
    .eq("member_id", member.id);

  const existingMap = new Map<
    string,
    { status: RecommendationStatus; feedback?: string }
  >((existing ?? []).map((r: any) => [r.mission_id, r]));

  // 3. Compute scores and build upsert payload
  const upsertRows = missions.map((mission) => {
    const existing = existingMap.get(mission.id);
    const { score, breakdown } = computeMatchScore(member, mission);

    return {
      member_id: member.id,
      mission_id: mission.id,
      score,
      breakdown: breakdown as any,
      // Preserve human-set statuses; only reset 'pending' / 'viewed'
      status:
        existing?.status === "accepted" || existing?.status === "refused"
          ? existing.status
          : "pending",
      feedback: existing?.feedback ?? null,
      computed_at: new Date().toISOString(),
    };
  });

  // 4. Upsert (insert or replace score data)
  const { error: upsertErr } = await supabase
    .from("mission_recommendations")
    .upsert(upsertRows, { onConflict: "member_id,mission_id" });

  if (upsertErr) throw new Error(upsertErr.message);

  // 5. Mark all newly-fetched as 'viewed' if still 'pending'
  await supabase
    .from("mission_recommendations")
    .update({ status: "viewed" })
    .eq("member_id", member.id)
    .eq("status", "pending");

  // 6. Fetch the final stored rows (with mission join)
  let query = supabase
    .from("mission_recommendations")
    .select(
      `
      *,
      mission:mission_id (
        id, title, description, category,
        required_skills, personality_fit,
        schedule_days, schedule_time,
        duration_weeks, points_reward,
        is_active, created_by, created_at
      )
    `,
    )
    .eq("member_id", member.id)
    .order("score", { ascending: false });

  if (!includeRefused) {
    query = query.neq("status", "refused");
  }

  const { data: recs, error: fetchErr } = await query;
  if (fetchErr) throw new Error(fetchErr.message);

  return (recs ?? []).map((r: any) => ({
    ...r,
    breakdown: Array.isArray(r.breakdown) ? r.breakdown : [],
  })) as MissionRecommendation[];
}

// ─── NGO-side: getNGORecommendations ──────────────────────────────────────────

/**
 * For a given mission, fetches all validated member profiles, scores them,
 * and returns a ranked list of ProfileMatch objects.
 * Results are also persisted in mission_recommendations.
 */
export async function getNGORecommendations(
  mission: Mission,
): Promise<ProfileMatch[]> {
  // 1. Load all validated profiles with fields the scoring engine needs
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select(
      `
      id, fullname, email, avatar_url, job_title,
      specialties, availability_days, availability_time,
      personality_type, preferred_committee, preferred_activity_type,
      points
    `,
    )
    .eq("is_validated", true);

  if (profErr) throw new Error(profErr.message);
  if (!profiles?.length) return [];

  // 2. Fetch latest JPS for each member
  const memberIds = profiles.map((p: any) => p.id);
  const { data: jpsBatch } = await supabase
    .from("jps_snapshots")
    .select("member_id, score, year, month")
    .in("member_id", memberIds)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  const jpsMap = new Map<string, number>();
  (jpsBatch ?? []).forEach((row: any) => {
    if (!jpsMap.has(row.member_id)) jpsMap.set(row.member_id, row.score ?? 0);
  });

  // 3. Enrich members with jps_score and cast to Member
  const members: Member[] = profiles.map((p: any) => ({
    ...p,
    jps_score: jpsMap.get(p.id) ?? 0,
    strengths: [],
    weaknesses: [],
    cotisation_status: [],
    is_validated: true,
    role: "member",
  }));

  // 4. Rank members
  const ranked = rankMembersForMission(members, mission);

  // 5. Load existing recommendation statuses so we don't overwrite feedback
  const { data: existingRecs } = await supabase
    .from("mission_recommendations")
    .select("member_id, status, feedback")
    .eq("mission_id", mission.id);

  const existingMap = new Map<
    string,
    { status: RecommendationStatus; feedback?: string }
  >((existingRecs ?? []).map((r: any) => [r.member_id, r]));

  // 6. Upsert scores
  const upsertRows = ranked.map(({ member, result }) => {
    const ex = existingMap.get(member.id);
    return {
      member_id: member.id,
      mission_id: mission.id,
      score: result.score,
      breakdown: result.breakdown as any,
      status:
        ex?.status === "accepted" || ex?.status === "refused"
          ? ex.status
          : "pending",
      feedback: ex?.feedback ?? null,
      computed_at: new Date().toISOString(),
    };
  });

  await supabase
    .from("mission_recommendations")
    .upsert(upsertRows, { onConflict: "member_id,mission_id" });

  // 7. Return ranked ProfileMatch list
  return ranked.map(({ member, result }) => {
    const ex = existingMap.get(member.id);
    return {
      member_id: member.id,
      mission_id: mission.id,
      score: result.score,
      grade: result.grade,
      breakdown: result.breakdown,
      status: (ex?.status ?? "pending") as RecommendationStatus,
      feedback: ex?.feedback,
      profile: {
        id: member.id,
        fullname: member.fullname,
        email: member.email,
        avatar_url: member.avatar_url,
        job_title: member.job_title,
        specialties: member.specialties,
        personality_type: member.personality_type as any,
        preferred_committee: member.preferred_committee,
        points: member.points,
        jps_score: (member as any).jps_score ?? 0,
      },
    };
  });
}

// ─── Feedback (accept / refuse) ───────────────────────────────────────────────

export async function submitRecommendationFeedback(
  dto: SubmitFeedbackDTO,
): Promise<void> {
  const { error } = await supabase
    .from("mission_recommendations")
    .update({
      status: dto.status,
      feedback: dto.feedback ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dto.recommendationId);

  if (error) throw new Error(error.message);
}

/**
 * Convenience: refuse a recommendation by (member_id, mission_id) pair
 * instead of the recommendation row id.
 */
export async function refuseRecommendation(
  memberId: string,
  missionId: string,
  feedback?: string,
): Promise<void> {
  const { error } = await supabase
    .from("mission_recommendations")
    .update({
      status: "refused",
      feedback: feedback ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("member_id", memberId)
    .eq("mission_id", missionId);

  if (error) throw new Error(error.message);
}

export async function acceptRecommendation(
  memberId: string,
  missionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("mission_recommendations")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("member_id", memberId)
    .eq("mission_id", missionId);

  if (error) throw new Error(error.message);
}

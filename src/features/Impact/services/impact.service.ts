import supabase from '../../../utils/supabase';
import type {
  UserEngagement,
  ImpactReport,
  CreateUserEngagementDTO,
  GenerateImpactReportDTO
} from '../types';

// ─── USER ENGAGEMENTS ──────────────────────────────────────────────────────

/**
 * Logs a new user engagement action (e.g., event attendance, task completed).
 */
export async function logUserEngagement(dto: CreateUserEngagementDTO): Promise<UserEngagement> {
  const { data, error } = await supabase
    .from('user_engagements')
    .insert(dto)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as UserEngagement;
}

/**
 * Retrieves all engagement logs for a specific member.
 */
export async function getUserEngagements(memberId: string): Promise<UserEngagement[]> {
  const { data, error } = await supabase
    .from('user_engagements')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as UserEngagement[];
}

/**
 * Computes the aggregated impact summary for a single user.
 */
export async function getUserImpactSummary(memberId: string) {
  const engagements = await getUserEngagements(memberId);

  const summary = {
    totalHours: 0,
    totalPoints: 0,
    totalImpactScore: 0,
    actionsCount: engagements.length,
    byType: {} as Record<string, number>
  };

  engagements.forEach(eng => {
    summary.totalHours += Number(eng.hours_contributed || 0);
    summary.totalPoints += Number(eng.points_earned || 0);
    summary.totalImpactScore += Number(eng.impact_score || 0);

    const type = eng.action_type;
    summary.byType[type] = (summary.byType[type] || 0) + 1;
  });

  return summary;
}

// ─── IMPACT REPORTS ─────────────────────────────────────────────────────────

/**
 * Generates and saves a new impact report by aggregating user engagements
 * over the specified period.
 */
export async function generateImpactReport(dto: GenerateImpactReportDTO): Promise<ImpactReport> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Fetch relevant engagements within the date range
  let query = supabase
    .from('user_engagements')
    .select('member_id, hours_contributed, points_earned, impact_score, activity_id');

  if (dto.period_start) {
    query = query.gte('created_at', dto.period_start);
  }
  if (dto.period_end) {
    query = query.lte('created_at', dto.period_end);
  }

  const { data: engagements, error } = await query;
  if (error) throw new Error(error.message);

  // 2. Aggregate data
  const uniqueVolunteers = new Set<string>();
  const uniqueActivities = new Set<string>();
  let totalHours = 0;
  let totalImpactScore = 0;

  (engagements || []).forEach(eng => {
    uniqueVolunteers.add(eng.member_id);
    if (eng.activity_id) {
      uniqueActivities.add(eng.activity_id);
    }
    totalHours += Number(eng.hours_contributed || 0);
    totalImpactScore += Number(eng.impact_score || 0);
  });

  // 3. Generate suggestions based on data heuristics
  const suggestions: string[] = [];
  if (totalHours < 50) {
    suggestions.push("Consider organizing a major weekend volunteering drive to boost community hours.");
  } else {
    suggestions.push("Volunteer retention is strong. Focus on leadership training for top contributors to amplify impact.");
  }

  if (uniqueActivities.size < 5) {
    suggestions.push("Diversify your activity portfolio to attract members with different skill sets and interests.");
  } else {
    suggestions.push("High activity volume detected. Ensure quality over quantity and monitor volunteer burnout.");
  }

  const metrics = {
    total_impact_score: totalImpactScore,
    avg_hours_per_volunteer: uniqueVolunteers.size > 0
      ? Number((totalHours / uniqueVolunteers.size).toFixed(2))
      : 0
  };

  // 4. Save report to database
  const { data: report, error: insertError } = await supabase
    .from('impact_reports')
    .insert({
      organization_id: dto.organization_id || null,
      report_type: dto.report_type,
      title: dto.title,
      period_start: dto.period_start || null,
      period_end: dto.period_end || null,
      total_hours: totalHours,
      total_volunteers: uniqueVolunteers.size,
      activities_completed: uniqueActivities.size,
      metrics,
      suggestions,
      generated_by: user.id
    })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);
  return report as ImpactReport;
}

/**
 * Retrieves past impact reports, optionally filtered by organization.
 */
export async function getImpactReports(orgId?: string): Promise<ImpactReport[]> {
  let query = supabase
    .from('impact_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as ImpactReport[];
}

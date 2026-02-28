export type ActionType = 'event_attendance' | 'task_completed' | 'initiative_led' | 'general_contribution';
export type ReportType = 'ngo_summary' | 'partner_aggregation' | 'user_impact';

export interface UserEngagement {
  id: string;
  member_id: string;
  activity_id?: string;
  action_type: ActionType;
  hours_contributed: number;
  points_earned: number;
  impact_score: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ImpactReport {
  id: string;
  organization_id?: string;
  report_type: ReportType;
  title: string;
  period_start?: string;
  period_end?: string;
  total_hours: number;
  total_volunteers: number;
  activities_completed: number;
  metrics: Record<string, number | string>; // Generic metrics object
  suggestions: string[]; // AI/System suggestions
  generated_by?: string;
  created_at: string;
  updated_at: string;
}

// DTOs for creation and filtering
export interface CreateUserEngagementDTO {
  member_id: string;
  activity_id?: string;
  action_type: ActionType;
  hours_contributed?: number;
  points_earned?: number;
  impact_score?: number;
  metadata?: Record<string, any>;
}

export interface GenerateImpactReportDTO {
  report_type: ReportType;
  title: string;
  period_start?: string;
  period_end?: string;
  organization_id?: string;
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

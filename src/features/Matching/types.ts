// ─── Mission ──────────────────────────────────────────────────────────────────

export type ScheduleTime = 'matinal' | 'afternoon' | 'full_day';

export type PersonalityType = 'Dominant' | 'Influence' | 'Steadiness' | 'Conscientious';

export type RecommendationStatus = 'pending' | 'viewed' | 'accepted' | 'refused';

export interface Mission {
  id: string;
  title: string;
  description?: string;
  category?: string;
  required_skills: string[];
  personality_fit: PersonalityType[];
  schedule_days: string[];
  schedule_time?: ScheduleTime;
  duration_weeks: number;
  points_reward: number;
  is_active: boolean;
  organization_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;

  // optional join
  organization?: { id: string; name: string; logo_url?: string };
  creator?: { id: string; fullname?: string; avatar_url?: string };
}

// ─── Score Breakdown ──────────────────────────────────────────────────────────

export type ScoreFactor =
  | 'Skills Match'
  | 'Availability'
  | 'Personality Fit'
  | 'Domain Interest'
  | 'Engagement Level';

export interface ScoreBreakdown {
  factor: ScoreFactor;
  points: number;
  maxPoints: number;
  pct: number;           // points / maxPoints * 100
  explanation: string;
  matched?: string[];    // e.g. skill names that matched
}

export interface ScoringResult {
  score: number;         // 0–100
  grade: MatchGrade;
  breakdown: ScoreBreakdown[];
}

export type MatchGrade = 'Excellent' | 'Good' | 'Fair' | 'Low';

export function gradeFromScore(score: number): MatchGrade {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Low';
}

export const GRADE_META: Record<
  MatchGrade,
  { color: string; bg: string; border: string; ring: string; label: string }
> = {
  Excellent: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    ring: '#10b981',
    label: 'Excellent Match',
  },
  Good: {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    ring: '#3b82f6',
    label: 'Good Match',
  },
  Fair: {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    ring: '#f59e0b',
    label: 'Fair Match',
  },
  Low: {
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    ring: '#f43f5e',
    label: 'Low Match',
  },
};

// ─── Recommendation ───────────────────────────────────────────────────────────

export interface MissionRecommendation {
  id: string;
  member_id: string;
  mission_id: string;
  score: number;
  breakdown: ScoreBreakdown[];
  status: RecommendationStatus;
  feedback?: string;
  computed_at: string;
  updated_at: string;

  // optional join
  mission?: Mission;
}

// ─── NGO-side: profile ranked against a mission ───────────────────────────────

export interface ProfileMatch {
  member_id: string;
  mission_id: string;
  score: number;
  grade: MatchGrade;
  breakdown: ScoreBreakdown[];
  status: RecommendationStatus;
  feedback?: string;

  // joined profile data
  profile: {
    id: string;
    fullname?: string;
    email?: string;
    avatar_url?: string;
    job_title?: string;
    specialties?: string[];
    personality_type?: PersonalityType;
    preferred_committee?: string;
    points?: number;
    jps_score?: number;
  };
}

// ─── Create / Update DTOs ─────────────────────────────────────────────────────

export interface CreateMissionDTO {
  title: string;
  description?: string;
  category?: string;
  required_skills?: string[];
  personality_fit?: PersonalityType[];
  schedule_days?: string[];
  schedule_time?: ScheduleTime;
  duration_weeks?: number;
  points_reward?: number;
}

export interface UpdateMissionDTO extends Partial<CreateMissionDTO> {
  is_active?: boolean;
}

export interface SubmitFeedbackDTO {
  recommendationId: string;
  status: 'accepted' | 'refused';
  feedback?: string;
}

// ─── Scoring weights (must sum to 100) ────────────────────────────────────────

export const SCORE_WEIGHTS: Record<ScoreFactor, number> = {
  'Skills Match':     35,
  'Availability':     20,
  'Personality Fit':  15,
  'Domain Interest':  15,
  'Engagement Level': 15,
};

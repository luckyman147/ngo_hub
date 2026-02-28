export type CotisationStatus = boolean[];

export type Role = string;

export interface Complaint {
  id: string;
  member_id: string;
  content: string;
  status: "pending" | "resolved"; // simple status
  created_at: string;
}

export interface Poste {
  id: string;
  role_id: string;
  name: string;
}

export interface Member {
  id: string;
  fullname: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  poste_id?: string;
  poste?: Poste;

  // Member specific fields

  points: number;
  cotisation_status: CotisationStatus;
  is_validated: boolean;

  description?: string;
  strengths?: string[];
  weaknesses?: string[];

  complaints?: Complaint[];

  created_at?: string;
  birth_date?: string;
  is_banned?: boolean;

  // Professional & Availability
  job_title?: string;
  specialties?: string[];
  availability_days?: string[];
  availability_time?: "matinal" | "afternoon" | "full_day";

  // Personalization
  astrological_sign?: string;
  preferred_social_media?: string;
  social_media_link?: string;
  preferred_committee?: string;
  preferred_activity_type?: string;
  preferred_meal?: string;
  personality_type?: "Dominant" | "Influence" | "Steadiness" | "Conscientious";
  estimated_volunteering_hours?: number;
  advisor_id?: string;
  advisor?: Partial<Member>;
  advisees?: Partial<Member>[];

  // JPS specific fields
  jps_score?: number;
  jps_category?: string;
  leaderboard_privacy?: boolean;

  // AI Personalization
  ai_personalization_enabled?: boolean;
}

export interface ActivityLog {
  id: string;
  activity_name: string;
  date: string;
  points_earned: number;
}

export interface PointsHistoryEntry {
  id: string;
  points: number;
  source_type: string;
  description: string;
  created_at: string;
}

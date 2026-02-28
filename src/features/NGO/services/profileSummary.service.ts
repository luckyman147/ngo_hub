import supabase from '../../../utils/supabase';
import type { Member } from '../../Members/types';

export interface ProfileSummaryInput {
  fullname?: string;
  description?: string;
  strengths?: string[];
  weaknesses?: string[];
  job_title?: string;
  specialties?: string[];
  availability_days?: string[];
  availability_time?: string;
  preferred_committee?: string;
  preferred_activity_type?: string;
  personality_type?: string;
  estimated_volunteering_hours?: number;
}

export async function generateProfileSummary(profile: ProfileSummaryInput): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-profile-summary', {
    body: profile,
  });

  if (error) throw error;
  if (!data?.summary) throw new Error('No summary returned');
  return data.summary as string;
}

export function memberToProfileInput(member: Partial<Member>): ProfileSummaryInput {
  return {
    fullname: member.fullname,
    description: member.description,
    strengths: member.strengths,
    weaknesses: member.weaknesses,
    job_title: member.job_title,
    specialties: member.specialties,
    availability_days: member.availability_days,
    availability_time: member.availability_time,
    preferred_committee: member.preferred_committee,
    preferred_activity_type: member.preferred_activity_type,
    personality_type: member.personality_type,
    estimated_volunteering_hours: member.estimated_volunteering_hours,
  };
}

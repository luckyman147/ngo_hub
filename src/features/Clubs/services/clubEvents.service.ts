import supabase from '../../../utils/supabase';
import type { ClubEvent } from '../types';

export async function getPublicClubEvents(): Promise<ClubEvent[]> {
  const { data, error } = await supabase
    .from('club_events')
    .select(`
      *,
      club:clubs(name)
    `)
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as ClubEvent[];
}

export async function getClubEvents(clubId?: string): Promise<ClubEvent[]> {
  let query = supabase
    .from('club_events')
    .select(`
      *,
      club:clubs(name)
    `)
    .order('start_at', { ascending: true });

  if (clubId) {
    query = query.eq('club_id', clubId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ClubEvent[];
}

export async function createClubEvent(input: {
  club_id: string;
  title: string;
  description?: string;
  image_url?: string;
  location?: string;
  start_at: string;
  end_at?: string;
}): Promise<ClubEvent> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('club_events')
    .insert({
      ...input,
      created_by: user.id,
    })
    .select('*, club:clubs(name)')
    .single();

  if (error) throw error;
  return data as ClubEvent;
}

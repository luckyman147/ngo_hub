import type { NGO, NGOCreateInput, NGOUpdateInput } from '../types';
import supabase from '../../../utils/supabase';

export async function createNGO(input: NGOCreateInput): Promise<NGO> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('ngos')
    .insert({
      name: input.name,
      mission: input.mission,
      description: input.description ?? null,
      causes: input.causes ?? [],
      needs: input.needs ?? [],
      region: input.region ?? null,
      creator_id: user.id,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getNGOsByCreator(creatorId: string): Promise<NGO[]> {
  const { data, error } = await supabase
    .from('ngos')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getNGOById(id: string): Promise<NGO | null> {
  const { data, error } = await supabase
    .from('ngos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function updateNGO(id: string, input: NGOUpdateInput): Promise<NGO> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.mission !== undefined) payload.mission = input.mission;
  if (input.description !== undefined) payload.description = input.description;
  if (input.causes !== undefined) payload.causes = input.causes;
  if (input.needs !== undefined) payload.needs = input.needs;
  if (input.region !== undefined) payload.region = input.region;
  if (input.status !== undefined) payload.status = input.status;

  const { data, error } = await supabase
    .from('ngos')
    .update(payload)
    .eq('id', id)
    .eq('creator_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

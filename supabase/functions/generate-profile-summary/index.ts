import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileInput {
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

function buildProfileText(profile: ProfileInput): string {
  const parts: string[] = [];
  if (profile.fullname) parts.push(`Name: ${profile.fullname}`);
  if (profile.description) parts.push(`About: ${profile.description}`);
  if (profile.job_title) parts.push(`Job: ${profile.job_title}`);
  if (profile.strengths?.length) parts.push(`Strengths: ${profile.strengths.join(', ')}`);
  if (profile.weaknesses?.length) parts.push(`Areas to develop: ${profile.weaknesses.join(', ')}`);
  if (profile.specialties?.length) parts.push(`Specialties: ${profile.specialties.join(', ')}`);
  if (profile.availability_days?.length) parts.push(`Available days: ${profile.availability_days.join(', ')}`);
  if (profile.availability_time) parts.push(`Preferred time: ${profile.availability_time}`);
  if (profile.preferred_committee) parts.push(`Preferred committee: ${profile.preferred_committee}`);
  if (profile.preferred_activity_type) parts.push(`Preferred activity type: ${profile.preferred_activity_type}`);
  if (profile.personality_type) parts.push(`Personality: ${profile.personality_type}`);
  if (profile.estimated_volunteering_hours != null)
    parts.push(`Estimated volunteering hours: ${profile.estimated_volunteering_hours}/week`);
  return parts.join('\n') || 'No profile data provided.';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profile: ProfileInput = await req.json();
    const profileText = buildProfileText(profile);

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that writes brief, professional profile summaries for volunteers on a civic engagement platform. Write 2-4 short sentences. Be positive and inclusive. Use neutral, accessible language. Do not use emojis.',
        },
        {
          role: 'user',
          content: `Generate a brief professional summary of this volunteer profile:\n\n${profileText}`,
        },
      ],
      max_tokens: 150,
      temperature: 0.6,
    });

    const summary = completion.choices[0]?.message?.content?.trim() ?? '';

    return new Response(
      JSON.stringify({ summary }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('generate-profile-summary error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

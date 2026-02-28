import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // 2. Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Fetch user profile & settings
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*, jps_snapshots(score, year, month)')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if AI is disabled
    if (profile.ai_personalization_enabled === false) {
      return new Response(
        JSON.stringify({
          enabled: false,
          message: 'AI Personalization is disabled in your profile settings.',
          recommendations: [],
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 4. Gather context for AI (or rule-based fallback)
    const { data: recentFeedback } = await supabaseClient
      .from('ai_feedback')
      .select('suggestion_type, rating')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentTasks } = await supabaseClient
      .from('member_tasks')
      .select('status')
      .eq('member_id', user.id)

    // Analyze workload for burnout prevention
    const pendingTasks = recentTasks?.filter((t) => t.status !== 'completed').length || 0
    const declaredHours = profile.estimated_volunteering_hours || 0

    // JPS score progression (proxy for activity level)
    const jpsHistory = (profile.jps_snapshots || []).sort(
      (a: any, b: any) => b.year - a.year || b.month - a.month
    )
    const currentJps = jpsHistory[0]?.score || 0

    // 5. Generate AI Suggestions
    // In a real production scenario with OpenAI, you would build a prompt here and call the OpenAI API.
    // For this implementation, we use a robust rule-based engine that mimics AI behavior,
    // ensuring it works immediately without requiring API keys.

    const suggestions = []

    // --- Burnout Prevention Logic ---
    if (pendingTasks > 5 || declaredHours > 20 || currentJps > 80) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'burnout_prevention',
        text: `You have ${pendingTasks} active tasks and log ${declaredHours} hrs/week. Remember that taking breaks makes you more productive. Consider delegating your next task.`,
        priority: 'high',
      })
    } else if (pendingTasks === 0 && currentJps < 20) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'engagement_boost',
        text: "You haven't picked up any tasks recently. Check the Activities board to find a low-effort mission and get back in the game!",
        priority: 'low',
      })
    } else {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'burnout_prevention',
        text: 'Consistency is key! You are maintaining a healthy balance. Make sure to log off completely this weekend.',
        priority: 'medium',
      })
    }

    // --- Personalized Role/Skill Recommendations ---
    const strengths = profile.strengths || []
    if (strengths.includes('Leadership') || strengths.includes('Project Management')) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'mission_recommendation',
        text: 'Based on your leadership skills, you would be a great fit to lead an upcoming event committee. Talk to the VP of Events!',
        priority: 'medium',
      })
    }

    if (profile.preferred_committee) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'general_tip',
        text: `As someone interested in the ${profile.preferred_committee} committee, consider hosting a 15-minute knowledge sharing session next week.`,
        priority: 'low',
      })
    }

    // Adjust based on past feedback (simple feedback loop)
    const hatesBurnoutTips = recentFeedback?.filter(
      (f) => f.suggestion_type === 'burnout_prevention' && f.rating === 'unhelpful'
    ).length || 0

    const finalSuggestions = hatesBurnoutTips >= 2
      ? suggestions.filter((s) => s.type !== 'burnout_prevention') // AI learned to stop annoying them
      : suggestions

    // 6. Return the personalized payload
    return new Response(
      JSON.stringify({
        enabled: true,
        recommendations: finalSuggestions,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

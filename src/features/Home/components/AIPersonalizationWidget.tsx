import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  HeartPulse,
  Target,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  BotOff,
} from "lucide-react";
import supabase from "../../../utils/supabase";
import { useAuth } from "../../Authentication/auth.context";

interface AISuggestion {
  id: string;
  type: "burnout_prevention" | "mission_recommendation" | "general_tip" | "engagement_boost";
  text: string;
  priority: "high" | "medium" | "low";
}

export default function AIPersonalizationWidget() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "helpful" | "unhelpful">>({});

  useEffect(() => {
    if (!user) return;

    async function fetchAI() {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;

        // Call the Edge Function
        // Using window.location.origin in dev, or your real Supabase URL if configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";

        const res = await fetch(`${supabaseUrl}/functions/v1/ai-personalization`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch AI suggestions");
        }

        const data = await res.json();

        setEnabled(data.enabled);
        setSuggestions(data.recommendations || []);
      } catch (err) {
        console.error("AI Widget Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAI();
  }, [user]);

  const handleFeedback = async (suggestion: AISuggestion, rating: "helpful" | "unhelpful") => {
    if (!user) return;

    // Optimistic UI update
    setFeedbackGiven((prev) => ({ ...prev, [suggestion.id]: rating }));

    // Send to database
    try {
      await supabase.from("ai_feedback").insert({
        member_id: user.id,
        suggestion_type: suggestion.type,
        suggestion_text: suggestion.text,
        rating,
      });
    } catch (err) {
      console.error("Failed to submit AI feedback:", err);
    }
  };

  const dismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "burnout_prevention":
        return <HeartPulse className="w-5 h-5 text-rose-500" />;
      case "mission_recommendation":
        return <Target className="w-5 h-5 text-[var(--color-myPrimary)]" />;
      default:
        return <Lightbulb className="w-5 h-5 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[160px]">
        <Loader2 className="w-6 h-6 text-[var(--color-myPrimary)] animate-spin mb-3" />
        <p className="text-sm text-gray-500 font-medium animate-pulse">
          Analyzing your profile...
        </p>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
          <BotOff className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">AI Assistant Disabled</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            You have turned off smart recommendations in your profile.
          </p>
          <Link
            to="/me"
            className="text-xs font-bold text-[var(--color-myPrimary)] hover:underline"
          >
            Enable in Settings &rarr;
          </Link>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Hide widget if no suggestions
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-2xl p-5 border border-indigo-100 shadow-sm relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-myPrimary)] to-indigo-600 opacity-5 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-indigo-600" />
        <h3 className="font-bold text-gray-900 text-sm tracking-wide">
          For You
        </h3>
      </div>

      <div className="space-y-3 relative z-10">
        {suggestions.map((s) => {
          const feedback = feedbackGiven[s.id];

          return (
            <div
              key={s.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-indigo-50 flex gap-3 group transition-all hover:shadow-md"
            >
              <div className="shrink-0 mt-0.5">{getIcon(s.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-relaxed pr-6">
                  {s.text}
                </p>

                {/* Feedback Actions */}
                <div className="mt-3 flex items-center gap-2">
                  {feedback ? (
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      Thanks for the feedback!
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleFeedback(s, "helpful")}
                        className="text-[10px] font-bold text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-md transition flex items-center gap-1"
                      >
                        <ThumbsUp className="w-3 h-3" /> Helpful
                      </button>
                      <button
                        onClick={() => handleFeedback(s, "unhelpful")}
                        className="text-[10px] font-bold text-gray-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md transition flex items-center gap-1"
                      >
                        <ThumbsDown className="w-3 h-3" /> Not really
                      </button>
                    </>
                  )}
                </div>
              </div>

               {/* Dismiss Button */}
               <button
                onClick={() => dismissSuggestion(s.id)}
                className="absolute top-4 right-4 p-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

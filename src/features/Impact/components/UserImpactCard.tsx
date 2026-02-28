import { useAuth } from '../../Authentication/auth.context';
import { useUserImpactSummary } from '../hooks/useImpact';
import { Clock, Zap, Target, Star, Loader2, Award } from 'lucide-react';

export default function UserImpactCard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useUserImpactSummary(user?.id);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-[var(--color-myPrimary)] animate-spin mb-3" />
        <p className="text-sm text-gray-500 font-medium animate-pulse">Calculating your impact...</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
      {/* Decorative background flair */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-myPrimary)] to-blue-600 opacity-5 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />

      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Award className="w-4 h-4 text-[var(--color-myPrimary)]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">My Community Impact</h3>
          <p className="text-xs text-gray-500">Your total contribution to the organization</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hours Card */}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Volunteered</span>
          </div>
          <p className="text-3xl font-black text-blue-900">
            {summary.totalHours} <span className="text-sm font-medium text-blue-600">hrs</span>
          </p>
        </div>

        {/* Points Card */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Star className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Points Earned</span>
          </div>
          <p className="text-3xl font-black text-amber-900">
            {summary.totalPoints}
          </p>
        </div>

        {/* Impact Score Card */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Impact Score</span>
          </div>
          <p className="text-3xl font-black text-emerald-900">
            {summary.totalImpactScore}
          </p>
        </div>

        {/* Actions Card */}
        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Actions Logged</span>
          </div>
          <p className="text-3xl font-black text-purple-900">
            {summary.actionsCount}
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { ProfileCard } from './shared/ProfileCard';
import { generateProfileSummary, memberToProfileInput } from '../../../NGO/services/profileSummary.service';
import type { Member } from '../../types';

interface MemberAISummaryProps {
  member: Partial<Member>;
  readOnly?: boolean;
}

export default function MemberAISummary({ member, readOnly = true }: MemberAISummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasData =
    member.fullname ||
    member.description ||
    (member.strengths?.length ?? 0) > 0 ||
    (member.specialties?.length ?? 0) > 0;

  const handleGenerate = async () => {
    if (!hasData) return;
    setLoading(true);
    setError(null);
    try {
      const input = memberToProfileInput(member);
      const result = await generateProfileSummary(input);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileCard
      title="AI Profile Summary"
      subtitle="AI-generated brief overview of this volunteer"
      icon={Sparkles}
      iconColorClass="text-violet-600"
      iconBgClass="bg-violet-50"
      readOnly={readOnly}
      className="border-violet-100 hover:border-violet-200"
    >
      <div className="space-y-4">
        {summary ? (
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        ) : error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : (
          <p className="text-sm text-gray-500 italic">
            {hasData
              ? 'Generate a brief AI summary of this volunteer profile.'
              : 'Add profile information to generate an AI summary.'}
          </p>
        )}

        {hasData && !summary && !loading && (
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Generate Summary
          </button>
        )}

        {loading && (
          <div
            className="inline-flex items-center gap-2 text-sm text-gray-500"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Generating…
          </div>
        )}

        {summary && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="text-xs font-medium text-violet-600 hover:text-violet-700 underline underline-offset-2 disabled:opacity-60"
          >
            Regenerate
          </button>
        )}
      </div>
    </ProfileCard>
  );
}

import type { Member } from "../../Members/types";
import type {
  Mission,
  ScoreBreakdown,
  ScoringResult,
  ScoreFactor,
  MatchGrade,
} from "../types";
import { SCORE_WEIGHTS, gradeFromScore } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalise = (s: string) => s.trim().toLowerCase();

/** True if two skill strings are similar enough (exact or contains) */
function skillsOverlap(memberSkill: string, missionSkill: string): boolean {
  const m = normalise(memberSkill);
  const t = normalise(missionSkill);
  return m === t || m.includes(t) || t.includes(m);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pct(points: number, max: number): number {
  return max === 0 ? 0 : Math.round((points / max) * 100);
}

// ─── Factor scorers ───────────────────────────────────────────────────────────

function scoreSkills(member: Member, mission: Mission): ScoreBreakdown {
  const factor: ScoreFactor = "Skills Match";
  const max = SCORE_WEIGHTS[factor];
  const required = mission.required_skills ?? [];

  // Member skill pool: specialties + job_title words
  const memberPool: string[] = [
    ...(member.specialties ?? []),
    ...(member.job_title ? [member.job_title] : []),
  ];

  if (required.length === 0) {
    return {
      factor,
      points: Math.round(max * 0.5), // neutral: 50 %
      maxPoints: max,
      pct: 50,
      explanation: "No specific skills required for this mission.",
      matched: [],
    };
  }

  const matched = required.filter((req) =>
    memberPool.some((ms) => skillsOverlap(ms, req)),
  );

  const raw = (matched.length / required.length) * max;
  const points = Math.round(clamp(raw, 0, max));

  let explanation: string;
  if (matched.length === 0) {
    explanation =
      member.specialties?.length
        ? `None of your current skills match the ${required.length} required skill(s). Consider updating your profile.`
        : "Add your specialties to your profile to improve this score.";
  } else if (matched.length === required.length) {
    explanation = `Perfect skills match — you have all ${required.length} required skill(s).`;
  } else {
    explanation = `You match ${matched.length} out of ${required.length} required skill(s).`;
  }

  return { factor, points, maxPoints: max, pct: pct(points, max), explanation, matched };
}

function scoreAvailability(member: Member, mission: Mission): ScoreBreakdown {
  const factor: ScoreFactor = "Availability";
  const max = SCORE_WEIGHTS[factor];
  const missionDays = mission.schedule_days ?? [];
  const memberDays = member.availability_days ?? [];
  const missionTime = mission.schedule_time;
  const memberTime = member.availability_time;

  if (missionDays.length === 0 && !missionTime) {
    return {
      factor,
      points: Math.round(max * 0.5),
      maxPoints: max,
      pct: 50,
      explanation: "This mission has a flexible schedule.",
      matched: [],
    };
  }

  // Days sub-score (70 % of availability weight)
  let dayPoints = 0;
  const daysWeight = Math.round(max * 0.7);
  if (missionDays.length === 0) {
    dayPoints = daysWeight; // no constraint → full
  } else if (memberDays.length === 0) {
    dayPoints = 0;
  } else {
    const overlap = missionDays.filter((d) => memberDays.includes(d));
    dayPoints = Math.round((overlap.length / missionDays.length) * daysWeight);
  }

  // Time sub-score (30 % of availability weight)
  let timePoints = 0;
  const timeWeight = max - daysWeight;
  if (!missionTime || !memberTime) {
    timePoints = Math.round(timeWeight * 0.5); // unknown → neutral
  } else if (missionTime === memberTime || memberTime === "full_day") {
    timePoints = timeWeight;
  } else {
    timePoints = 0;
  }

  const points = clamp(dayPoints + timePoints, 0, max);

  const dayOverlap =
    missionDays.length > 0 && memberDays.length > 0
      ? missionDays.filter((d) => memberDays.includes(d))
      : [];

  let explanation: string;
  if (memberDays.length === 0) {
    explanation = "Add your availability days to your profile to improve this score.";
  } else if (dayOverlap.length === missionDays.length) {
    explanation = `Your schedule fully covers the ${missionDays.length} required day(s).`;
  } else if (dayOverlap.length > 0) {
    explanation = `You are available ${dayOverlap.length} of ${missionDays.length} required day(s): ${dayOverlap.join(", ")}.`;
  } else {
    explanation = "Your available days do not overlap with the mission schedule.";
  }

  return {
    factor,
    points: Math.round(points),
    maxPoints: max,
    pct: pct(Math.round(points), max),
    explanation,
    matched: dayOverlap,
  };
}

function scorePersonality(member: Member, mission: Mission): ScoreBreakdown {
  const factor: ScoreFactor = "Personality Fit";
  const max = SCORE_WEIGHTS[factor];
  const required = (mission.personality_fit ?? []) as string[];
  const memberType = member.personality_type;

  if (required.length === 0) {
    return {
      factor,
      points: Math.round(max * 0.5),
      maxPoints: max,
      pct: 50,
      explanation: "This mission is open to all personality types.",
    };
  }

  if (!memberType) {
    return {
      factor,
      points: Math.round(max * 0.3),
      maxPoints: max,
      pct: 30,
      explanation: "Set your personality type on your profile to unlock a personalised score.",
    };
  }

  const isMatch = required.includes(memberType);
  const points = isMatch ? max : Math.round(max * 0.1);

  return {
    factor,
    points,
    maxPoints: max,
    pct: pct(points, max),
    explanation: isMatch
      ? `Your ${memberType} personality is one of the ideal fits for this mission.`
      : `This mission favours ${required.join(" / ")} — your ${memberType} type can still contribute.`,
    matched: isMatch ? [memberType] : [],
  };
}

function scoreDomain(member: Member, mission: Mission): ScoreBreakdown {
  const factor: ScoreFactor = "Domain Interest";
  const max = SCORE_WEIGHTS[factor];
  const missionCategory = mission.category?.toLowerCase().trim() ?? "";
  const memberCommittee = member.preferred_committee?.toLowerCase().trim() ?? "";
  const memberActivityType = member.preferred_activity_type?.toLowerCase().trim() ?? "";

  if (!missionCategory) {
    return {
      factor,
      points: Math.round(max * 0.5),
      maxPoints: max,
      pct: 50,
      explanation: "This mission spans multiple domains.",
    };
  }

  if (!memberCommittee && !memberActivityType) {
    return {
      factor,
      points: Math.round(max * 0.3),
      maxPoints: max,
      pct: 30,
      explanation:
        "Set your preferred committee on your profile to get a domain-specific score.",
    };
  }

  const exactMatch = memberCommittee === missionCategory;
  const partialMatch =
    !exactMatch &&
    (memberCommittee.includes(missionCategory) ||
      missionCategory.includes(memberCommittee) ||
      memberActivityType.includes(missionCategory));

  const points = exactMatch
    ? max
    : partialMatch
      ? Math.round(max * 0.5)
      : Math.round(max * 0.1);

  return {
    factor,
    points,
    maxPoints: max,
    pct: pct(points, max),
    explanation: exactMatch
      ? `This mission is in your preferred ${mission.category} domain — great alignment!`
      : partialMatch
        ? `Partial domain match between your interests and this mission's ${mission.category} focus.`
        : `You prefer ${member.preferred_committee} but this mission focuses on ${mission.category}.`,
    matched: exactMatch || partialMatch ? [mission.category ?? ""] : [],
  };
}

function scoreEngagement(member: Member): ScoreBreakdown {
  const factor: ScoreFactor = "Engagement Level";
  const max = SCORE_WEIGHTS[factor];

  // Points sub-score: 0–500 pts maps to 0–10
  const memberPoints = member.points ?? 0;
  const pointsSub = Math.round(clamp((memberPoints / 500) * 10, 0, 10));

  // JPS sub-score: 0–50 maps to 0–5
  const jpsScore = (member as any).jps_score ?? 0;
  const jpsSub = Math.round(clamp((jpsScore / 50) * 5, 0, 5));

  const points = clamp(pointsSub + jpsSub, 0, max);

  let explanation: string;
  if (points >= 12) {
    explanation = `Highly active member — ${memberPoints} points & JPS ${Number(jpsScore).toFixed(1)}.`;
  } else if (points >= 8) {
    explanation = `Good engagement — keep joining activities to boost your score.`;
  } else if (points >= 4) {
    explanation = `Moderate engagement — earn more points by participating in events.`;
  } else {
    explanation = `Start participating in activities to build your engagement score.`;
  }

  return {
    factor,
    points: Math.round(points),
    maxPoints: max,
    pct: pct(Math.round(points), max),
    explanation,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Compute a 0–100 compatibility score between a member profile and a mission.
 * Pure function — no side-effects, no network calls.
 */
export function computeMatchScore(
  member: Member,
  mission: Mission,
): ScoringResult {
  const breakdown: ScoreBreakdown[] = [
    scoreSkills(member, mission),
    scoreAvailability(member, mission),
    scorePersonality(member, mission),
    scoreDomain(member, mission),
    scoreEngagement(member),
  ];

  const total = breakdown.reduce((sum, b) => sum + b.points, 0);
  const score = clamp(Math.round(total), 0, 100);
  const grade: MatchGrade = gradeFromScore(score);

  return { score, grade, breakdown };
}

/**
 * Returns the single most impactful piece of advice to improve the score.
 */
export function topImprovementTip(breakdown: ScoreBreakdown[]): string {
  const worst = [...breakdown]
    .filter((b) => b.pct < 70)
    .sort((a, b) => {
      // Weight by gap size relative to max weight
      const gapA = (a.maxPoints - a.points) / a.maxPoints;
      const gapB = (b.maxPoints - b.points) / b.maxPoints;
      return gapB - gapA;
    })[0];

  return worst?.explanation ?? "Your profile is well-optimised for this mission!";
}

/**
 * Bulk-score a list of missions for one member and return them sorted best-first.
 */
export function rankMissionsForMember(
  member: Member,
  missions: Mission[],
): Array<{ mission: Mission; result: ScoringResult }> {
  return missions
    .map((mission) => ({ mission, result: computeMatchScore(member, mission) }))
    .sort((a, b) => b.result.score - a.result.score);
}

/**
 * Bulk-score a list of member profiles against one mission, sorted best-first.
 */
export function rankMembersForMission(
  members: Member[],
  mission: Mission,
): Array<{ member: Member; result: ScoringResult }> {
  return members
    .map((member) => ({ member, result: computeMatchScore(member, mission) }))
    .sort((a, b) => b.result.score - a.result.score);
}

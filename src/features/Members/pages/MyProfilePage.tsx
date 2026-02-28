import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Save,
  X,
  Plus,
  Pencil,
  User,
  Briefcase,
  Clock,
  Globe,
  Star,
  Shield,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Heart,
  Zap,
  Bot,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import Navbar from "../../../Global_Components/navBar";
import { useMyProfile } from "../hooks/useMyProfile";
import type { Member } from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const JOB_OPTIONS = [
  "Student",
  "Software Engineer",
  "Civil Engineer",
  "Doctor",
  "Lawyer",
  "Accountant",
  "Manager",
  "Entrepreneur",
  "Graphic Designer",
  "Marketing Specialist",
  "Teacher",
  "Freelancer",
  "Data Analyst",
  "Business Consultant",
  "Architect",
  "Pharmacist",
];

const SPECIALTY_OPTIONS = [
  "Project Management",
  "Strategic Planning",
  "Public Speaking",
  "Graphic Design",
  "Web Development",
  "Digital Marketing",
  "Human Resources",
  "Financial Analysis",
  "Event Planning",
  "Crisis Management",
  "Training & Coaching",
  "Soft Skills",
  "Legal Advice",
  "Copywriting",
  "SEO",
  "Data Visualization",
  "UI/UX Design",
];

const STRENGTH_OPTIONS = [
  "Leadership",
  "Communication",
  "Teamwork",
  "Problem Solving",
  "Public Speaking",
  "Creativity",
  "Organization",
  "Adaptability",
  "Strategic Thinking",
  "Project Management",
  "Conflict Resolution",
  "Decision Making",
  "Time Management",
  "Networking",
];

const WEAKNESS_OPTIONS = [
  "Public Speaking",
  "Time Management",
  "Delegation",
  "Patience",
  "Attention to Detail",
  "Networking",
  "Self-promotion",
  "Perfectionism",
  "Overcommitting",
  "Conflict Avoidance",
];

const SOCIAL_PLATFORMS = [
  "LinkedIn",
  "Twitter / X",
  "Instagram",
  "Facebook",
  "GitHub",
  "Behance",
  "YouTube",
  "TikTok",
];

const COMMITTEE_OPTIONS = [
  "Communication",
  "Events",
  "Finance",
  "HR",
  "IT",
  "Legal",
  "Marketing",
  "Projects",
  "Training",
];

const ACTIVITY_TYPE_OPTIONS = [
  "Events",
  "Formations",
  "Meetings",
  "General Assembly",
];
const MEAL_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Omnivore",
  "Halal",
  "Kosher",
  "No preference",
];

const SIGN_OPTIONS = [
  "Aries ♈",
  "Taurus ♉",
  "Gemini ♊",
  "Cancer ♋",
  "Leo ♌",
  "Virgo ♍",
  "Libra ♎",
  "Scorpio ♏",
  "Sagittarius ♐",
  "Capricorn ♑",
  "Aquarius ♒",
  "Pisces ♓",
];

const PERSONALITY_TYPES: {
  type: Member["personality_type"];
  emoji: string;
  label: string;
  desc: string;
  inactiveCls: string;
  activeCls: string;
}[] = [
    {
      type: "Dominant",
      emoji: "🦁",
      label: "Dominant",
      desc: "Results-driven, direct & decisive",
      inactiveCls: "border-red-200 bg-red-50 text-red-800",
      activeCls: "border-red-500 bg-red-500 text-white shadow-lg shadow-red-100",
    },
    {
      type: "Influence",
      emoji: "🌟",
      label: "Influence",
      desc: "Enthusiastic, optimistic & social",
      inactiveCls: "border-yellow-200 bg-yellow-50 text-yellow-800",
      activeCls:
        "border-yellow-400 bg-yellow-400 text-white shadow-lg shadow-yellow-100",
    },
    {
      type: "Steadiness",
      emoji: "🌿",
      label: "Steadiness",
      desc: "Patient, reliable & team-oriented",
      inactiveCls: "border-green-200 bg-green-50 text-green-800",
      activeCls:
        "border-green-500 bg-green-500 text-white shadow-lg shadow-green-100",
    },
    {
      type: "Conscientious",
      emoji: "🔬",
      label: "Conscientious",
      desc: "Analytical, precise & systematic",
      inactiveCls: "border-blue-200 bg-blue-50 text-blue-800",
      activeCls:
        "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-100",
    },
  ];

// ─── Shared style tokens ──────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none " +
  "focus:border-[var(--color-myPrimary)] focus:ring-2 focus:ring-[var(--color-myPrimary)]/10 " +
  "transition bg-gray-50 focus:bg-white";

const labelCls =
  "block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  iconColor = "text-[var(--color-myPrimary)]",
  iconBg = "bg-blue-50",
  children,
  editing,
  onEdit,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  children: React.ReactNode;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
          >
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
        </div>

        {!editing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-myPrimary)] hover:bg-blue-50 px-3 py-1.5 rounded-xl transition"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-xl transition"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--color-myPrimary)] hover:opacity-90 disabled:opacity-60 px-3 py-1.5 rounded-xl transition"
            >
              {saving ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save
            </button>
          </div>
        )}
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  multiline = false,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {label}
        </p>
        {value ? (
          <p
            className={`text-sm text-gray-900 font-medium mt-0.5 ${multiline ? "whitespace-pre-wrap" : "truncate"}`}
          >
            {value}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic mt-0.5">Not specified</p>
        )}
      </div>
    </div>
  );
}

// ─── Tag chip ─────────────────────────────────────────────────────────────────

function Tag({
  label,
  onRemove,
  color = "bg-blue-50 text-blue-700 border-blue-100",
}: {
  label: string;
  onRemove?: () => void;
  color?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${color}`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:opacity-60 transition"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

// ─── TagEditor ────────────────────────────────────────────────────────────────

function TagEditor({
  tags,
  setTags,
  options,
  placeholder,
  color,
}: {
  tags: string[];
  setTags: (t: string[]) => void;
  options: string[];
  placeholder: string;
  color: string;
}) {
  const [custom, setCustom] = useState("");
  const add = (val: string) => {
    const v = val.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
  };

  return (
    <div className="space-y-3">
      <select
        className={inputCls}
        onChange={(e) => {
          if (e.target.value) {
            add(e.target.value);
            e.target.value = "";
          }
        }}
      >
        <option value="">Quick-add from list…</option>
        {options
          .filter((o) => !tags.includes(o))
          .map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
      </select>

      <div className="flex gap-2">
        <input
          type="text"
          className={inputCls}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(custom);
              setCustom("");
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            add(custom);
            setCustom("");
          }}
          className="px-3 py-2 rounded-xl bg-[var(--color-myPrimary)] text-white shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Tag
            key={t}
            label={t}
            color={color}
            onRemove={() => setTags(tags.filter((x) => x !== t))}
          />
        ))}
        {tags.length === 0 && (
          <p className="text-xs text-gray-400 italic">None added yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── Empty placeholder ────────────────────────────────────────────────────────

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 italic">{text}</p>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function MyProfilePage() {
  const navigate = useNavigate();
  const {
    profile,
    isLoading,
    isSaving,
    avatarUploading,
    updateProfile,
    uploadAvatar,
    error,
  } = useMyProfile();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // ── 1. Personal ─────────────────────────────────────────────────────────────
  const [pFullname, setPFullname] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pBirth, setPBirth] = useState("");
  const [pBio, setPBio] = useState("");

  // ── 2. Professional ─────────────────────────────────────────────────────────
  const [prJob, setPrJob] = useState("");
  const [prSpecialties, setPrSpecialties] = useState<string[]>([]);

  // ── 3. Availability ─────────────────────────────────────────────────────────
  const [avDays, setAvDays] = useState<string[]>([]);
  const [avTime, setAvTime] = useState<"matinal" | "afternoon" | "full_day">(
    "matinal",
  );
  const [avHours, setAvHours] = useState(0);

  // ── 4. Social & Preferences ─────────────────────────────────────────────────
  const [socPlatform, setSocPlatform] = useState("");
  const [socLink, setSocLink] = useState("");
  const [socCommittee, setSocCommittee] = useState("");
  const [socActivityType, setSocActivityType] = useState("");
  const [socMeal, setSocMeal] = useState("");
  const [socSign, setSocSign] = useState("");

  // ── 5. Personality ──────────────────────────────────────────────────────────
  const [personality, setPersonality] =
    useState<Member["personality_type"]>(undefined);

  // ── 6. Strengths & Weaknesses ───────────────────────────────────────────────
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);

  // ── 7. Settings ─────────────────────────────────────────────────────────────
  const [aiEnabled, setAiEnabled] = useState(true);

  // Sync all local state when profile loads
  useEffect(() => {
    if (!profile) return;
    setPFullname(profile.fullname ?? "");
    setPPhone(profile.phone ?? "");
    setPBirth(profile.birth_date ?? "");
    setPBio(profile.description ?? "");
    setPrJob(profile.job_title ?? "");
    setPrSpecialties(profile.specialties ?? []);
    setAvDays(profile.availability_days ?? []);
    setAvTime((profile.availability_time as any) ?? "matinal");
    setAvHours(profile.estimated_volunteering_hours ?? 0);
    setSocPlatform(profile.preferred_social_media ?? "");
    setSocLink(profile.social_media_link ?? "");
    setSocCommittee(profile.preferred_committee ?? "");
    setSocActivityType(profile.preferred_activity_type ?? "");
    setSocMeal(profile.preferred_meal ?? "");
    setSocSign(profile.astrological_sign ?? "");
    setPersonality(profile.personality_type);
    setStrengths(profile.strengths ?? []);
    setWeaknesses(profile.weaknesses ?? []);
    setAiEnabled(profile.ai_personalization_enabled ?? true);
  }, [profile]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const startEdit = (s: string) => setEditingSection(s);

  const cancelEdit = (reset: () => void) => {
    reset();
    setEditingSection(null);
  };

  const saveSection = async (updates: Partial<Member>) => {
    await updateProfile(updates);
    setEditingSection(null);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAvatar(file);
    e.target.value = "";
  };

  // ── Profile completion score ─────────────────────────────────────────────────

  const completionChecks = [
    !!profile?.avatar_url,
    !!profile?.phone,
    !!profile?.birth_date,
    !!profile?.description,
    (profile?.strengths?.length ?? 0) > 0,
    (profile?.weaknesses?.length ?? 0) > 0,
    !!profile?.job_title,
    (profile?.specialties?.length ?? 0) > 0,
    (profile?.availability_days?.length ?? 0) > 0,
    !!profile?.preferred_social_media,
    !!profile?.personality_type,
  ];
  const completionPct = profile
    ? Math.round(
      (completionChecks.filter(Boolean).length / completionChecks.length) *
      100,
    )
    : 0;

  // ── Loading / not found ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-myPrimary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 px-4">
        <div className="rounded-2xl border border-red-100 bg-white shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <User className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Profile could not be loaded
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {error
                ? `Error: ${(error as Error).message}`
                : "Your profile row was not found in the database. This usually means the profiles table trigger did not run when your account was created."}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-left">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">
              How to fix
            </p>
            <p className="text-xs text-amber-600">
              Go to your Supabase dashboard → SQL Editor and run:
            </p>
            <pre className="mt-2 text-[11px] bg-white border border-amber-100 rounded-lg p-2 text-gray-700 whitespace-pre-wrap break-all select-all">
              {`INSERT INTO public.profiles (id, email, fullname)
VALUES (auth.uid(), auth.email(), '')
ON CONFLICT (id) DO NOTHING;`}
            </pre>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 rounded-xl bg-[var(--color-myPrimary)] text-white text-sm font-semibold hover:opacity-90 transition"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6 pb-28 md:pb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* ════════════════════════════════════════════════════════════
              HERO CARD
          ════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Gradient banner */}
            <div className="h-24 bg-gradient-to-r from-[var(--color-myPrimary)] to-[var(--color-mySecondary)]" />

            <div className="px-5 sm:px-6 pb-6 -mt-12">
              {/* Avatar + completion row */}
              <div className="flex items-end justify-between mb-5">
                {/* Clickable avatar */}
                <div
                  className="relative group cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <div className="w-24 h-24 rounded-2xl border-4 border-white bg-gray-100 overflow-hidden shadow-xl">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.fullname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                        {profile.fullname?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {avatarUploading ? (
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Camera badge */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--color-myPrimary)] flex items-center justify-center border-2 border-white shadow">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />

                {/* Completion bar */}
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium mb-1.5">
                    Profile completion
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-myPrimary)] to-[var(--color-mySecondary)] transition-all duration-700"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-[var(--color-myPrimary)] w-8 text-right">
                      {completionPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Name + meta */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                    {profile.fullname}
                    {profile.is_validated && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                  </h1>

                  <div className="flex flex-wrap gap-3 mt-1.5">
                    {profile.email && (
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        {profile.email}
                      </span>
                    )}
                    {profile.phone && (
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {profile.phone}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {(profile as any).role && (
                      <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest border border-gray-200">
                        {(profile as any).role}
                      </span>
                    )}
                    {(profile as any).poste?.name && (
                      <span className="px-2 py-0.5 rounded-lg bg-[var(--color-myPrimary)] text-white text-[10px] font-black uppercase tracking-widest">
                        {(profile as any).poste.name}
                      </span>
                    )}
                    {String(profile.cotisation_status) === "paid" && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        ✓ Paid
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 shrink-0">
                  <div className="text-center">
                    <p className="text-xl font-black text-[var(--color-myPrimary)]">
                      {profile.points ?? 0}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Points
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-amber-500">
                      {Number((profile as any).jps_score ?? 0).toFixed(0)}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      JPS
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-gray-400 italic">
                Click your avatar to upload a new photo.
              </p>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════
              1. PERSONAL INFORMATION
          ════════════════════════════════════════════════════════════ */}
          <Section
            title="Personal Information"
            icon={User}
            editing={editingSection === "personal"}
            onEdit={() => startEdit("personal")}
            onCancel={() =>
              cancelEdit(() => {
                setPFullname(profile.fullname ?? "");
                setPPhone(profile.phone ?? "");
                setPBirth(profile.birth_date ?? "");
                setPBio(profile.description ?? "");
              })
            }
            onSave={() =>
              saveSection({
                fullname: pFullname || undefined,
                phone: pPhone || undefined,
                birth_date: pBirth || undefined,
                description: pBio || undefined,
              })
            }
            saving={isSaving}
          >
            {editingSection === "personal" ? (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={pFullname}
                    onChange={(e) => setPFullname(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input
                      type="tel"
                      className={inputCls}
                      value={pPhone}
                      onChange={(e) => setPPhone(e.target.value)}
                      placeholder="+213 000 000 000"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Birth Date</label>
                    <input
                      type="date"
                      className={inputCls}
                      value={pBirth}
                      onChange={(e) => setPBirth(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Bio</label>
                  <textarea
                    rows={4}
                    className={inputCls + " resize-none"}
                    value={pBio}
                    onChange={(e) => setPBio(e.target.value)}
                    placeholder="Tell us a bit about yourself…"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <InfoRow
                  icon={User}
                  label="Full Name"
                  value={profile.fullname}
                />
                <InfoRow icon={Phone} label="Phone" value={profile.phone} />
                <InfoRow
                  icon={Calendar}
                  label="Birth Date"
                  value={
                    profile.birth_date
                      ? new Date(profile.birth_date).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )
                      : undefined
                  }
                />
                <InfoRow
                  icon={User}
                  label="Bio"
                  value={profile.description}
                  multiline
                />
              </div>
            )}
          </Section>

          {/* ════════════════════════════════════════════════════════════
              2. PROFESSIONAL PROFILE
          ════════════════════════════════════════════════════════════ */}
          <Section
            title="Professional Profile"
            icon={Briefcase}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            editing={editingSection === "professional"}
            onEdit={() => startEdit("professional")}
            onCancel={() =>
              cancelEdit(() => {
                setPrJob(profile.job_title ?? "");
                setPrSpecialties(profile.specialties ?? []);
              })
            }
            onSave={() =>
              saveSection({
                job_title: prJob || undefined,
                specialties: prSpecialties,
              })
            }
            saving={isSaving}
          >
            {editingSection === "professional" ? (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Job / Occupation</label>
                  <select
                    className={inputCls}
                    value={JOB_OPTIONS.includes(prJob) ? prJob : ""}
                    onChange={(e) => setPrJob(e.target.value)}
                  >
                    <option value="">Select from list…</option>
                    {JOB_OPTIONS.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className={inputCls + " mt-2"}
                    value={prJob}
                    onChange={(e) => setPrJob(e.target.value)}
                    placeholder="Or type a custom job title…"
                  />
                </div>

                <div>
                  <label className={labelCls}>Specialties</label>
                  <TagEditor
                    tags={prSpecialties}
                    setTags={setPrSpecialties}
                    options={SPECIALTY_OPTIONS}
                    placeholder="Type a custom specialty…"
                    color="bg-indigo-50 text-indigo-700 border-indigo-100"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <InfoRow
                  icon={Briefcase}
                  label="Job / Occupation"
                  value={profile.job_title}
                />
                <div>
                  <p className={labelCls}>Specialties</p>
                  {(profile.specialties ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.specialties!.map((s) => (
                        <Tag
                          key={s}
                          label={s}
                          color="bg-indigo-50 text-indigo-700 border-indigo-100"
                        />
                      ))}
                    </div>
                  ) : (
                    <Empty text="No specialties added yet." />
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* ════════════════════════════════════════════════════════════
              3. AVAILABILITY
          ════════════════════════════════════════════════════════════ */}
          <Section
            title="Availability"
            icon={Clock}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            editing={editingSection === "availability"}
            onEdit={() => startEdit("availability")}
            onCancel={() =>
              cancelEdit(() => {
                setAvDays(profile.availability_days ?? []);
                setAvTime((profile.availability_time as any) ?? "matinal");
                setAvHours(profile.estimated_volunteering_hours ?? 0);
              })
            }
            onSave={() =>
              saveSection({
                availability_days: avDays,
                availability_time: avTime,
                estimated_volunteering_hours: avHours,
              })
            }
            saving={isSaving}
          >
            {editingSection === "availability" ? (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Available Days</label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {DAYS.map((day) => {
                      const active = avDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setAvDays(
                              active
                                ? avDays.filter((d) => d !== day)
                                : [...avDays, day],
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${active
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100"
                              : "bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-300"
                            }`}
                        >
                          {DAY_SHORT[day]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Preferred Time</label>
                  <div className="flex gap-2">
                    {(["matinal", "afternoon", "full_day"] as const).map(
                      (slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setAvTime(slot)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition capitalize ${avTime === slot
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-300"
                            }`}
                        >
                          {slot === "full_day"
                            ? "Full Day"
                            : slot.charAt(0).toUpperCase() + slot.slice(1)}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Estimated Volunteering Hours / week
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={168}
                    className={inputCls}
                    value={avHours}
                    onChange={(e) => setAvHours(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className={labelCls}>Available Days</p>
                  {(profile.availability_days ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.availability_days!.map((d) => (
                        <Tag
                          key={d}
                          label={DAY_SHORT[d] ?? d}
                          color="bg-emerald-50 text-emerald-700 border-emerald-100"
                        />
                      ))}
                    </div>
                  ) : (
                    <Empty text="No days specified." />
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <InfoRow
                    icon={Clock}
                    label="Preferred Time"
                    value={
                      profile.availability_time === "full_day"
                        ? "Full Day"
                        : profile.availability_time
                          ? profile.availability_time.charAt(0).toUpperCase() +
                          profile.availability_time.slice(1)
                          : undefined
                    }
                  />
                  <InfoRow
                    icon={Zap}
                    label="Volunteering Hours / week"
                    value={
                      profile.estimated_volunteering_hours
                        ? `${profile.estimated_volunteering_hours} hrs`
                        : undefined
                    }
                  />
                </div>
              </div>
            )}
          </Section>

          {/* ════════════════════════════════════════════════════════════
              4. SOCIAL & PREFERENCES
          ════════════════════════════════════════════════════════════ */}
          <Section
            title="Social & Preferences"
            icon={Globe}
            iconColor="text-pink-600"
            iconBg="bg-pink-50"
            editing={editingSection === "social"}
            onEdit={() => startEdit("social")}
            onCancel={() =>
              cancelEdit(() => {
                setSocPlatform(profile.preferred_social_media ?? "");
                setSocLink(profile.social_media_link ?? "");
                setSocCommittee(profile.preferred_committee ?? "");
                setSocActivityType(profile.preferred_activity_type ?? "");
                setSocMeal(profile.preferred_meal ?? "");
                setSocSign(profile.astrological_sign ?? "");
              })
            }
            onSave={() =>
              saveSection({
                preferred_social_media: socPlatform || undefined,
                social_media_link: socLink || undefined,
                preferred_committee: socCommittee || undefined,
                preferred_activity_type: socActivityType || undefined,
                preferred_meal: socMeal || undefined,
                astrological_sign: socSign || undefined,
              })
            }
            saving={isSaving}
          >
            {editingSection === "social" ? (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Social Media Platform</label>
                    <select
                      className={inputCls}
                      value={socPlatform}
                      onChange={(e) => setSocPlatform(e.target.value)}
                    >
                      <option value="">Select platform…</option>
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Profile Link</label>
                    <input
                      type="url"
                      className={inputCls}
                      value={socLink}
                      onChange={(e) => setSocLink(e.target.value)}
                      placeholder="https://linkedin.com/in/you"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Preferred Committee</label>
                    <select
                      className={inputCls}
                      value={socCommittee}
                      onChange={(e) => setSocCommittee(e.target.value)}
                    >
                      <option value="">Select committee…</option>
                      {COMMITTEE_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Preferred Activity Type</label>
                    <select
                      className={inputCls}
                      value={socActivityType}
                      onChange={(e) => setSocActivityType(e.target.value)}
                    >
                      <option value="">Select type…</option>
                      {ACTIVITY_TYPE_OPTIONS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Preferred Meal</label>
                    <select
                      className={inputCls}
                      value={socMeal}
                      onChange={(e) => setSocMeal(e.target.value)}
                    >
                      <option value="">Select meal…</option>
                      {MEAL_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Astrological Sign</label>
                    <select
                      className={inputCls}
                      value={socSign}
                      onChange={(e) => setSocSign(e.target.value)}
                    >
                      <option value="">Select sign…</option>
                      {SIGN_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={Globe}
                  label="Social Platform"
                  value={profile.preferred_social_media}
                />
                <InfoRow
                  icon={Globe}
                  label="Profile Link"
                  value={profile.social_media_link}
                />
                <InfoRow
                  icon={Star}
                  label="Preferred Committee"
                  value={profile.preferred_committee}
                />
                <InfoRow
                  icon={Calendar}
                  label="Preferred Activity"
                  value={profile.preferred_activity_type}
                />
                <InfoRow
                  icon={Heart}
                  label="Preferred Meal"
                  value={profile.preferred_meal}
                />
                <InfoRow
                  icon={Star}
                  label="Astrological Sign"
                  value={profile.astrological_sign}
                />
              </div>
            )}
          </Section>

          {/* ════════════════════════════════════════════════════════════
              5. PERSONALITY TYPE (DISC)
          ════════════════════════════════════════════════════════════ */}
          <Section
            title="Personality Type (DISC)"
            icon={Zap}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
            editing={editingSection === "personality"}
            onEdit={() => startEdit("personality")}
            onCancel={() =>
              cancelEdit(() => setPersonality(profile.personality_type))
            }
            onSave={() => saveSection({ personality_type: personality })}
            saving={isSaving}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PERSONALITY_TYPES.map((pt) => {
                const isActive = personality === pt.type;
                return (
                  <button
                    key={pt.type}
                    type="button"
                    disabled={editingSection !== "personality"}
                    onClick={() => setPersonality(pt.type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition
                      ${editingSection === "personality" ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default"}
                      ${isActive ? pt.activeCls : pt.inactiveCls}
                    `}
                  >
                    <span className="text-2xl">{pt.emoji}</span>
                    <span className="text-xs font-black uppercase tracking-widest">
                      {pt.label}
                    </span>
                    <span
                      className={`text-[10px] font-medium text-center leading-tight ${isActive ? "text-white/80" : "opacity-60"}`}
                    >
                      {pt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
            {editingSection !== "personality" && !profile.personality_type && (
              <p className="text-sm text-gray-400 italic mt-3">
                Click Edit to select your personality type.
              </p>
            )}
          </Section>

          {/* ════════════════════════════════════════════════════════════
              6. STRENGTHS & WEAKNESSES
          ════════════════════════════════════════════════════════════ */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Strengths */}
            <Section
              title="Strengths"
              icon={Shield}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
              editing={editingSection === "strengths"}
              onEdit={() => startEdit("strengths")}
              onCancel={() =>
                cancelEdit(() => setStrengths(profile.strengths ?? []))
              }
              onSave={() => saveSection({ strengths })}
              saving={isSaving}
            >
              {editingSection === "strengths" ? (
                <TagEditor
                  tags={strengths}
                  setTags={setStrengths}
                  options={STRENGTH_OPTIONS}
                  placeholder="Add a strength…"
                  color="bg-emerald-50 text-emerald-700 border-emerald-100"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(profile.strengths ?? []).length > 0 ? (
                    profile.strengths!.map((s) => (
                      <Tag
                        key={s}
                        label={s}
                        color="bg-emerald-50 text-emerald-700 border-emerald-100"
                      />
                    ))
                  ) : (
                    <Empty text="No strengths added yet." />
                  )}
                </div>
              )}
            </Section>

            {/* Weaknesses */}
            <Section
              title="Weaknesses"
              icon={Heart}
              iconColor="text-rose-500"
              iconBg="bg-rose-50"
              editing={editingSection === "weaknesses"}
              onEdit={() => startEdit("weaknesses")}
              onCancel={() =>
                cancelEdit(() => setWeaknesses(profile.weaknesses ?? []))
              }
              onSave={() => saveSection({ weaknesses })}
              saving={isSaving}
            >
              {editingSection === "weaknesses" ? (
                <TagEditor
                  tags={weaknesses}
                  setTags={setWeaknesses}
                  options={WEAKNESS_OPTIONS}
                  placeholder="Add a weakness…"
                  color="bg-rose-50 text-rose-600 border-rose-100"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(profile.weaknesses ?? []).length > 0 ? (
                    profile.weaknesses!.map((w) => (
                      <Tag
                        key={w}
                        label={w}
                        color="bg-rose-50 text-rose-600 border-rose-100"
                      />
                    ))
                  ) : (
                    <Empty text="No weaknesses added yet." />
                  )}
                </div>
              )}
            </Section>
          </div>

          {/* ════════════════════════════════════════════════════════════
              7. SETTINGS
          ════════════════════════════════════════════════════════════ */}
          <Section
            title="Account Settings"
            icon={Bot}
            iconColor="text-gray-600"
            iconBg="bg-gray-100"
            editing={editingSection === "settings"}
            onEdit={() => startEdit("settings")}
            onCancel={() =>
              cancelEdit(() =>
                setAiEnabled(profile.ai_personalization_enabled ?? true),
              )
            }
            onSave={() =>
              saveSection({ ai_personalization_enabled: aiEnabled })
            }
            saving={isSaving}
          >
            {editingSection === "settings" ? (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`shrink-0 transition-colors ${aiEnabled ? "text-[var(--color-myPrimary)]" : "text-gray-400"}`}
                >
                  {aiEnabled ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    AI Personalization
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Allow our AI assistant to analyze your workload and
                    preferences to suggest relevant missions and give burnout
                    prevention tips.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100">
                <div className="shrink-0 mt-0.5">
                  {profile.ai_personalization_enabled !== false ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    AI Personalization is{" "}
                    {profile.ai_personalization_enabled !== false
                      ? "Enabled"
                      : "Disabled"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {profile.ai_personalization_enabled !== false
                      ? "You will receive smart mission recommendations and well-being tips."
                      : "The AI assistant is turned off for your account."}
                  </p>
                </div>
              </div>
            )}
          </Section>
        </div>
      </main>
    </div>
  );
}

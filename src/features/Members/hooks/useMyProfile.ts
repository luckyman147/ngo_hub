import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadAvatarImage } from "../../../utils/uploadHelpers";
import type { Member } from "../types";
import supabase from "../../../utils/supabase";
import { useAuth } from "../../Authentication/auth.context";

export const MY_PROFILE_KEY = ["my-profile"] as const;

async function fetchMyProfile(userId: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      fullname,
      email,
      phone,
      birth_date,
      avatar_url,
      description,
      points,
      cotisation_status,
      is_validated,
      job_title,
      specialties,
      availability_days,
      availability_time,
      estimated_volunteering_hours,
      preferred_social_media,
      social_media_link,
      preferred_committee,
      preferred_activity_type,
      preferred_meal,
      astrological_sign,
      personality_type,
      strengths,
      weaknesses,
      ai_personalization_enabled
    `,
    )
    .eq("id", userId)
    .single();

  let profileData = data;

  if (error) {
    if (error.code === 'PGRST116') {
      // Profile not found, this happens if the auth trigger didn't run.
      // Attempt to self-heal by inserting a blank profile
      const userRes = await supabase.auth.getUser();
      if (userRes.data.user) {
        const u = userRes.data.user;
        const { error: insertErr } = await supabase.from('profiles').insert({
          id: userId,
          email: u.email,
          fullname: u.user_metadata?.fullname || '',
          phone: u.user_metadata?.phone || '',
          birth_date: u.user_metadata?.birth_date || null
        });
        if (!insertErr) {
          // Re-fetch after successful insert
          const { data: newData, error: newError } = await supabase.from('profiles').select('*').eq('id', userId).single();
          if (!newError && newData) {
            profileData = newData;
          }
        } else {
          console.error("[useMyProfile] Self-healing insert error:", insertErr.message);
        }
      }
    } else {
      console.error("[useMyProfile] fetchMyProfile error:", error.message);
      return null;
    }
  }

  // If still no profile data after self-healing attempts
  if (!profileData) return null;

  // Fetch role name via roles table (roles.member_id → profiles.id)
  const { data: roleRow } = await supabase
    .from("roles")
    .select("name")
    .eq("member_id", userId)
    .maybeSingle();

  // Fetch poste via postes table (postes.member_id → profiles.id)
  const { data: posteRow } = await supabase
    .from("postes")
    .select("id, title")
    .eq("member_id", userId)
    .maybeSingle();

  // Fetch latest JPS snapshot
  const { data: jpsRows } = await supabase
    .from("jps_snapshots")
    .select("score, category, year, month")
    .eq("member_id", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1);

  const latestJps = jpsRows?.[0];

  return {
    ...profileData,
    role: roleRow?.name ?? "member",
    poste: posteRow
      ? { id: posteRow.id, name: posteRow.title, role_id: "" }
      : undefined,
    jps_score: latestJps?.score ?? 0,
    jps_category: latestJps?.category ?? "Observer",
    // ensure arrays are never null
    strengths: profileData.strengths ?? [],
    weaknesses: profileData.weaknesses ?? [],
    specialties: profileData.specialties ?? [],
    availability_days: profileData.availability_days ?? [],
  } as Member;
}

export function useMyProfile() {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [avatarUploading, setAvatarUploading] = useState(false);

  const userId = user?.id ?? null;

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const {
    data: profile,
    isLoading: profileLoading,
    error,
  } = useQuery({
    queryKey: [...MY_PROFILE_KEY, userId],
    queryFn: () => fetchMyProfile(userId!),
    enabled: !!userId && !authLoading,
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });

  // While auth is still resolving, treat as loading
  const isLoading = authLoading || profileLoading;

  // ── Update mutation ────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Member>) => {
      if (!userId) throw new Error("Not authenticated");

      // Only allow self-editable fields
      const allowed: (keyof Member)[] = [
        "fullname",
        "phone",
        "birth_date",
        "description",
        "avatar_url",
        "strengths",
        "weaknesses",
        "job_title",
        "specialties",
        "availability_days",
        "availability_time",
        "estimated_volunteering_hours",
        "astrological_sign",
        "preferred_social_media",
        "social_media_link",
        "preferred_committee",
        "preferred_activity_type",
        "preferred_meal",
        "personality_type",
        "ai_personalization_enabled",
      ];

      const payload: Partial<Member> = {};
      for (const key of allowed) {
        if (key in updates) {
          (payload as any)[key] = (updates as any)[key];
        }
      }

      if (Object.keys(payload).length === 0) return;

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", userId);

      if (error) throw new Error(error.message);

      // Keep Supabase auth metadata in sync for name / avatar
      if (payload.fullname || payload.avatar_url) {
        await supabase.auth.updateUser({
          data: {
            fullname: payload.fullname ?? user?.user_metadata?.fullname,
            avatar_url: payload.avatar_url ?? user?.user_metadata?.avatar_url,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...MY_PROFILE_KEY, userId] });
      toast.success("Profile updated!");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update profile.");
    },
  });

  const updateProfile = (updates: Partial<Member>) =>
    updateMutation.mutateAsync(updates);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const uploadAvatar = async (file: File) => {
    setAvatarUploading(true);
    try {
      const result = await uploadAvatarImage(file);
      if (!result.success || !result.url) {
        toast.error(result.error ?? "Avatar upload failed.");
        return;
      }
      await updateProfile({ avatar_url: result.url });
    } catch (err: any) {
      toast.error(err?.message ?? "Avatar upload failed.");
    } finally {
      setAvatarUploading(false);
    }
  };

  return {
    profile: profile ?? null,
    isLoading,
    isSaving: updateMutation.isPending,
    avatarUploading,
    error,
    updateProfile,
    uploadAvatar,
  };
}

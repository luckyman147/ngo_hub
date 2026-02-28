import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getUserEngagements,
  getUserImpactSummary,
  generateImpactReport,
  getImpactReports,
  logUserEngagement,
} from "../services/impact.service";
import type { CreateUserEngagementDTO, GenerateImpactReportDTO } from "../types";

export const IMPACT_KEYS = {
  all: ["impact"] as const,
  userEngagements: (userId: string) => [...IMPACT_KEYS.all, "engagements", userId] as const,
  userSummary: (userId: string) => [...IMPACT_KEYS.all, "summary", userId] as const,
  reports: (orgId?: string) => [...IMPACT_KEYS.all, "reports", orgId ?? "all"] as const,
};

// ─── USER IMPACT HOOKS ────────────────────────────────────────────────────────

export function useUserEngagements(userId?: string) {
  return useQuery({
    queryKey: IMPACT_KEYS.userEngagements(userId!),
    queryFn: () => getUserEngagements(userId!),
    enabled: !!userId,
  });
}

export function useUserImpactSummary(userId?: string) {
  return useQuery({
    queryKey: IMPACT_KEYS.userSummary(userId!),
    queryFn: () => getUserImpactSummary(userId!),
    enabled: !!userId,
  });
}

export function useLogEngagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateUserEngagementDTO) => logUserEngagement(dto),
    onSuccess: (data) => {
      // Invalidate both engagements and summary for the user
      queryClient.invalidateQueries({
        queryKey: IMPACT_KEYS.userEngagements(data.member_id),
      });
      queryClient.invalidateQueries({
        queryKey: IMPACT_KEYS.userSummary(data.member_id),
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to log engagement: ${error.message}`);
    },
  });
}

// ─── NGO/PARTNER REPORT HOOKS ─────────────────────────────────────────────────

export function useImpactReports(orgId?: string) {
  return useQuery({
    queryKey: IMPACT_KEYS.reports(orgId),
    queryFn: () => getImpactReports(orgId),
  });
}

export function useGenerateImpactReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: GenerateImpactReportDTO) => generateImpactReport(dto),
    onSuccess: (data) => {
      toast.success("Impact report generated successfully!");
      // Invalidate reports list (for the specific org and the general list)
      queryClient.invalidateQueries({
        queryKey: IMPACT_KEYS.reports(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: IMPACT_KEYS.reports(),
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });
}

import { useMemo, useState, useEffect } from 'react';
import { Trophy, Star, RefreshCw, Calendar, Target, Award } from 'lucide-react';
import type { Member } from '../../../types';
import { useTranslation } from 'react-i18next';
import { jpsService } from "../../../services/jpsService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "../../../../../lib/utils";
import { useAuth } from '../../../../Authentication/auth.context';
import { EXECUTIVE_LEVELS } from '../../../../../utils/roles';

interface Props {
    initialMembers?: Member[];
}

type PeriodType = 'month' | 'trimester' | 'year' | 'all';
type SortType = 'jps' | 'volunteering';
type CotisationFilterType = 'all' | 'paid' | 'unpaid';

interface ExtendedMember extends Member {
    jps_score: number;
    jps_category: string;
}

export function JPSLeaderboardStats(_props: Props) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [activePeriod, setActivePeriod] = useState<PeriodType>('month');
    const [sortBy] = useState<SortType>('jps');
    const [cotisationFilter] = useState<CotisationFilterType>('all');
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { role } = useAuth();

    const isAuthorized = useMemo(() => {
        const authorizedRoles = EXECUTIVE_LEVELS;
        return role && authorizedRoles.includes(role);
    }, [role]);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentTrimester = Math.ceil(currentMonth / 3);

    const loadData = async () => {
        try {
            setLoading(true);
            if (activePeriod === 'all') {
                const data = await jpsService.getTopMembersByPeriod('all', currentYear, 0);
                setLeaderboardData(data);
            } else {
                const value = activePeriod === 'month' ? currentMonth : currentTrimester;
                const data = await jpsService.getTopMembersByPeriod(activePeriod as any, currentYear, value);
                setLeaderboardData(data);
            }
        } catch (error) {
            console.error("Error loading JPS leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activePeriod]);

    const refreshJPSMutation = useMutation({
        mutationFn: () => jpsService.refreshAllJPS(activePeriod === 'month' ? 'month' : 'trimester'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members'] });
            loadData();
            toast.success("Recalculation complete! snapshots updated.");
        },
        onError: (err: any) => {
            toast.error("Recalculation failed: " + err.message);
        }
    });

    // Helper function to filter out Presidents and Vice-Presidents
    const filterOutExecutives = (members: any[]) => {
        return members.filter(m => {
            const roleName = (m.role || '').toLowerCase();
            // Exclude Presidents and Vice-Presidents
            return !roleName.includes('president') && !roleName.includes('vp');
        });
    };

    // Group members by role and get top 3 for each role
    const groupByRole = (members: any[]) => {
        const grouped: Record<string, any[]> = {};

        members.forEach(m => {
            const roleName = m.role || 'Member';
            if (!grouped[roleName]) grouped[roleName] = [];
            if (grouped[roleName].length < 3) {
                grouped[roleName].push(m);
            }
        });

        return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
    };

    // Best 3 members per role (highest JPS scores, excluding executives)
    const topMembersByRole = useMemo(() => {
        let filtered = filterOutExecutives([...leaderboardData]);

        // Apply Cotisation Filter
        if (cotisationFilter !== 'all') {
            filtered = filtered.filter(m => {
                const [s1, s2] = m.cotisation_status || [false, false];
                const isPaid = s1 || s2; // If either semester is paid
                return cotisationFilter === 'paid' ? isPaid : !isPaid;
            });
        }

        // Apply Sorting
        const sorted = filtered.sort((a, b) => {
            if (sortBy === 'volunteering') {
                return (b.estimated_volunteering_hours || 0) - (a.estimated_volunteering_hours || 0);
            }
            return b.jps_score - a.jps_score;
        });

        return groupByRole(sorted);
    }, [leaderboardData, sortBy, cotisationFilter]);

    const periods: { id: PeriodType; label: string }[] = [
        { id: 'month', label: t('common.month', 'Month') },
        { id: 'trimester', label: t('common.trimester', 'Trimester') },
        { id: 'year', label: t('common.year', 'Year') },
        { id: 'all', label: t('common.all', 'All') }
    ];

    const renderMemberCard = (member: ExtendedMember, index: number, showBadge = true) => (
        <div key={member.id} className="flex items-center justify-between group relative pl-2 transition-all hover:pl-4">
            {/* Accent Line on hover */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-(--color-mySecondary) rounded-full transition-all group-hover:h-full" />

            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                        {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-black text-gray-400 uppercase">
                                {member.fullname.charAt(0)}
                            </div>
                        )}
                    </div>
                    {showBadge && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-linear-to-br from-amber-400 to-amber-600 border-2 border-white rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-[10px] font-black text-white">#{index + 1}</span>
                        </div>
                    )}
                </div>
                <div className='gap-1 mx-1.5 flex-1 min-w-0'>
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-(--color-mySecondary) transition-colors">
                        {member.fullname}
                    </p>
                    {member.poste && (
                        <p className="text-[10px] text-emerald-600 font-bold italic opacity-80 mt-0.5 truncate">
                            {member.poste.name}
                        </p>
                    )}
                    <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">
                        {member.role}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-100 backdrop-blur-sm group-hover:bg-(--color-mySecondary) group-hover:border-(--color-mySecondary) transition-all shrink-0">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover:text-white group-hover:fill-white" />
                <span className="text-sm font-black text-(--color-myPrimary) group-hover:text-white">{member.jps_score}</span>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-gray-50 bg-linear-to-r from-white to-blue-50/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 rotate-3">
                            <Trophy className="w-7 h-7 text-white -rotate-3" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t('members.topJPSLeadership', 'Impact Performance Score')}</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-amber-600 font-black uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">Leaderboard</span>
                                <div className="h-1 w-1 rounded-full bg-gray-300" />
                                <p className="text-xs text-gray-500 font-medium">{t('members.byJPS', 'Member achievements & mentorship')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200/50">
                            {periods.map((period) => (
                                <button
                                    key={period.id}
                                    onClick={() => setActivePeriod(period.id)}
                                    className={cn(
                                        "px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 tracking-wide uppercase",
                                        activePeriod === period.id
                                            ? "bg-white text-(--color-myPrimary) shadow-md shadow-blue-200/50 scale-105"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                                    )}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>

                        {isAuthorized && (
                            <button
                                onClick={() => {
                                    if (refreshJPSMutation.isPending) {
                                        toast.info("Score recalculation is already in progress. Please wait...", {
                                            duration: 3000
                                        });
                                    } else {
                                        refreshJPSMutation.mutate();
                                    }
                                }}
                                disabled={refreshJPSMutation.isPending || loading}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest border shadow-sm",
                                    refreshJPSMutation.isPending
                                        ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                                        : "bg-(--color-myPrimary) text-white border-(--color-myPrimary) hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200"
                                )}
                            >
                                <RefreshCw className={cn("w-4 h-4", refreshJPSMutation.isPending && "animate-spin")} />
                                {refreshJPSMutation.isPending ? "Recalculating..." : "Recalculate"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-8">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p className="text-gray-400 text-sm font-medium animate-pulse">Syncing performance data...</p>
                    </div>
                ) : leaderboardData.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                        <Target className="w-12 h-12 text-gray-200 mb-4" />
                        <p className="text-gray-500 font-bold">No performance snapshots found for this period</p>
                        <p className="text-xs text-gray-400 mt-1">Try recalculating or select another period</p>
                    </div>
                ) : topMembersByRole.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                        <Target className="w-12 h-12 text-gray-200 mb-4" />
                        <p className="text-gray-500 font-bold">No members found for this period</p>
                        <p className="text-xs text-gray-400 mt-1">All members may be in executive roles</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                        {topMembersByRole.map(([role, roleMembers]: [string, ExtendedMember[]]) => (
                            <div key={role} className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1.5 inline-flex items-center gap-2 text-[10px] font-black capitalize tracking-wider  rounded-xl border-2 shadow-sm bg-white border-(--color-myPrimary) text-(--color-myPrimary)">
                                        <Award className="w-3.5 h-3.5" />
                                        {role}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {roleMembers.map((member, idx) => renderMemberCard(member, idx))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50/50 p-6 border-t border-gray-100 flex flex-wrap items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('common.lastSnapshot', 'Last Update')}: {new Date().toLocaleDateString()}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                <div className="flex items-center gap-2 text-gray-400">
                    <Award className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Period: {periods.find(p => p.id === activePeriod)?.label}</span>
                </div>
            </div>
        </div>
    );
}

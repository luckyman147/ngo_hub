import { useEffect, useState } from "react";
import { jpsService } from "../../../services/jpsService";
import type { JPSResult } from "../../../services/jpsService";
import { Loader, Users, Zap, Calendar, Target, TrendingUp, Info } from "lucide-react";
import { cn } from "../../../../../lib/utils";

interface MemberPerformanceComparisonProps {
    memberId: string;
}

export default function MemberPerformanceComparison({ memberId }: MemberPerformanceComparisonProps) {
    const [result, setResult] = useState<JPSResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMetrics = async () => {
            try {
                setLoading(true);
                const data = await jpsService.calculateJPS(memberId);
                setResult(data);
            } catch (error) {
                console.error("Error loading performance metrics:", error);
            } finally {
                setLoading(false);
            }
        };
        loadMetrics();
    }, [memberId]);

    if (loading) return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center lg:col-span-2">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 text-sm font-medium">Syncing performance metrics...</p>
        </div>
    );

    if (!result) return null;

    const { comparison } = result;

    const metrics = [
        {
            id: 'mis',
            title: 'Mentorship Impact',
            value: comparison.mentorshipImpact,
            unit: 'avg JPS',
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            description: 'Average performance of your advisees this trimester.',
            hint: 'High MIS identifies strong mentors and leadership coaches.'
        },
        {
            id: 'mci',
            title: 'Consistency Index',
            value: comparison.consistencyIndex,
            unit: '%',
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            description: 'Stability of activity over the last 6 months.',
            hint: 'A high MCI identifies reliable "piliers" of the organization.'
        },
        {
            id: 'cd',
            title: 'Contribution Density',
            value: comparison.contributionDensity,
            unit: 'pts/mo',
            icon: Zap,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            description: 'Points earned relative to tenure.',
            hint: 'Identifies "Rising Stars" who bring high value in short time.'
        },
        {
            id: 'doe',
            title: 'Engagement Diversity',
            value: comparison.engagementDiversity,
            unit: '%',
            icon: Target,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            description: 'Balance between meetings, trainings, and events.',
            hint: 'Identifies "All-Rounders" who contribute to all NGO pillars.'
        },
        {
            id: 'growth',
            title: 'Momentum Score',
            value: comparison.momentum,
            unit: '%',
            icon: TrendingUp,
            color: comparison.momentum >= 0 ? 'text-blue-600' : 'text-rose-600',
            bg: comparison.momentum >= 0 ? 'bg-blue-50' : 'bg-rose-50',
            description: 'Growth rate compared to previous period.',
            hint: 'Essential for tracking improvement and motivation trends.'
        }
    ];

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden flex flex-col lg:col-span-2">
            <div className="p-6 border-b border-gray-50 bg-linear-to-br from-gray-50 to-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-(--color-myAccent) rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/10">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Performance Comparison</h3>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5 italic">Advanced Value Metrics</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-4 flex-1">
                {metrics.map((m) => (
                    <div key={m.id} className="group relative">
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white hover:border-(--color-mySecondary) transition-all cursor-help">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", m.bg, m.color)}>
                                    <m.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{m.title}</p>
                                    <p className="text-[9px] text-gray-500 font-medium leading-tight mt-1 max-w-[180px]">{m.description}</p>
                                </div>
                            </div>
                            <div className="text-end">
                                <div className={cn("text-2xl font-black tabular-nums", m.color)}>
                                    {m.value > 0 && m.id === 'growth' ? `+${m.value}` : m.value}{m.unit}
                                </div>
                            </div>

                            {/* Tooltip hint on hover */}
                            <div className="absolute left-0 right-0 -bottom-12 z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300">
                                <div className="mx-4 p-2 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-xl border border-white/10 text-[10px] text-white font-medium flex items-start gap-2">
                                    <Info className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                                    {m.hint}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <p className="text-[9px] text-gray-400 italic text-center px-4 leading-relaxed">
                    Comparison metrics are calculated based on historical trimester data and mentorship relationships.
                </p>
            </div>
        </div>
    );
}

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
    ArrowLeft, Users, CalendarDays, FolderKanban,
    Clock, TrendingUp, UserCheck, UserPlus
} from 'lucide-react';
import Navbar from '../../../Global_Components/navBar';
import { getClubById } from '../services/clubs.service';
import { getClubEvents } from '../services/clubEvents.service';
import { getDepartments } from '../services/clubDepartments.service';
import { useAuth } from '../../Authentication/auth.context';
import type { ClubMember } from '../types';

export default function ClubDashboardPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data: club, isLoading } = useQuery({
        queryKey: ['club', id],
        queryFn: () => getClubById(id!),
        enabled: !!id,
    });

    const { data: events = [] } = useQuery({
        queryKey: ['club-events', id],
        queryFn: () => getClubEvents(id!),
        enabled: !!id,
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['club-departments', id],
        queryFn: () => getDepartments(id!),
        enabled: !!id,
    });

    const isPresident = club && user && club.president_id === user.id;
    const isBoardMember = (club as any)?.my_is_board_member === true;
    const canAccess = isPresident || isBoardMember;
    const members: ClubMember[] = (club as any)?.members ?? [];

    const acceptedMembers = members.filter((m) => m.status === 'accepted');
    const pendingMembers = members.filter((m) => m.status === 'pending');
    const boardMembers = acceptedMembers.filter((m) => m.is_board_member || (club && m.member_id === club.president_id));
    const regularMembers = acceptedMembers.filter((m) => !m.is_board_member && !(club && m.member_id === club.president_id));

    const upcomingEvents = events.filter((e: any) => new Date(e.start_at) >= new Date());
    const pastEvents = events.filter((e: any) => new Date(e.start_at) < new Date());

    const totalDeptMembers = departments.reduce((sum: number, d: any) => sum + (d.member_count ?? 0), 0);
    const totalDeptPending = departments.reduce((sum: number, d: any) => sum + (d.pending_count ?? 0), 0);

    // Redirect non-board users
    useEffect(() => {
        if (club && !canAccess) navigate(`/clubs/${id}`);
    }, [club, canAccess]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--color-myPrimary)] border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!club || !canAccess) return null;

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <Navbar />
            <main className="md:ms-64 pt-16 md:pt-6 pb-24 md:pb-6">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(`/clubs/${id}`)}
                                className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Board Dashboard</p>
                            </div>
                        </div>
                        {isPresident && (
                            <span className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 text-sm font-medium">
                                President
                            </span>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            icon={<Users className="w-5 h-5" />}
                            label="Total Members"
                            value={acceptedMembers.length}
                            color="from-blue-500 to-blue-600"
                        />
                        <StatCard
                            icon={<UserPlus className="w-5 h-5" />}
                            label="Pending Requests"
                            value={pendingMembers.length}
                            color="from-amber-500 to-orange-500"
                            highlight={pendingMembers.length > 0}
                        />
                        <StatCard
                            icon={<CalendarDays className="w-5 h-5" />}
                            label="Upcoming Events"
                            value={upcomingEvents.length}
                            color="from-emerald-500 to-green-600"
                        />
                        <StatCard
                            icon={<FolderKanban className="w-5 h-5" />}
                            label="Departments"
                            value={departments.length}
                            color="from-purple-500 to-violet-600"
                        />
                    </div>

                    {/* Two-column layout */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left column */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Membership Breakdown */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-[var(--color-myPrimary)]" />
                                    Membership Breakdown
                                </h2>
                                <div className="space-y-3">
                                    <BreakdownRow label="Board Members" count={boardMembers.length} total={acceptedMembers.length} color="bg-blue-500" />
                                    <BreakdownRow label="Regular Members" count={regularMembers.length} total={acceptedMembers.length} color="bg-emerald-500" />
                                    <BreakdownRow label="Pending Requests" count={pendingMembers.length} total={acceptedMembers.length + pendingMembers.length} color="bg-amber-500" />
                                </div>
                            </div>

                            {/* Departments Overview */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FolderKanban className="w-5 h-5 text-purple-500" />
                                    Departments Overview
                                </h2>
                                {departments.length === 0 ? (
                                    <p className="text-gray-500 text-sm py-4 text-center">
                                        No departments yet. Create one from the club page.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {departments.map((dept: any) => (
                                            <div key={dept.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div>
                                                    <p className="font-medium text-gray-900">{dept.name}</p>
                                                    {dept.description && <p className="text-xs text-gray-500 mt-0.5">{dept.description}</p>}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <UserCheck className="w-4 h-4" />
                                                        {dept.member_count ?? 0}
                                                    </span>
                                                    {(dept.pending_count ?? 0) > 0 && (
                                                        <span className="flex items-center gap-1 text-amber-600">
                                                            <Clock className="w-4 h-4" />
                                                            {dept.pending_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t border-gray-100 flex justify-between text-sm text-gray-500">
                                            <span>{totalDeptMembers} total department members</span>
                                            {totalDeptPending > 0 && (
                                                <span className="text-amber-600 font-medium">{totalDeptPending} pending</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Events Timeline */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5 text-emerald-500" />
                                    Events Timeline
                                </h2>
                                {events.length === 0 ? (
                                    <p className="text-gray-500 text-sm py-4 text-center">No events yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingEvents.map((ev: any) => (
                                            <EventRow key={ev.id} event={ev} isUpcoming />
                                        ))}
                                        {pastEvents.length > 0 && (
                                            <>
                                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Past Events</div>
                                                {pastEvents.slice(0, 5).map((ev: any) => (
                                                    <EventRow key={ev.id} event={ev} />
                                                ))}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right column — Quick Info */}
                        <div className="space-y-6">
                            {/* Pending Requests */}
                            {pendingMembers.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                        Pending Requests
                                    </h3>
                                    <ul className="space-y-2">
                                        {pendingMembers.slice(0, 8).map((m) => (
                                            <li key={m.id} className="flex items-center gap-2 text-sm">
                                                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {((m.member as any)?.fullname || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-gray-700 truncate">
                                                    {(m.member as any)?.fullname || `User ${m.member_id.slice(0, 6)}`}
                                                </span>
                                            </li>
                                        ))}
                                        {pendingMembers.length > 8 && (
                                            <li className="text-xs text-gray-500 text-center pt-1">
                                                +{pendingMembers.length - 8} more
                                            </li>
                                        )}
                                    </ul>
                                    <button
                                        onClick={() => navigate(`/clubs/${id}`)}
                                        className="w-full mt-3 py-2 text-sm font-medium text-[var(--color-myPrimary)] hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        Manage on Club Page →
                                    </button>
                                </div>
                            )}

                            {/* Board Members */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="font-bold text-gray-900 mb-3">Board Members</h3>
                                <ul className="space-y-2">
                                    {boardMembers.map((m) => (
                                        <li key={m.id} className="flex items-center gap-2 text-sm">
                                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {((m.member as any)?.fullname || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-gray-700 truncate block">
                                                    {(m.member as any)?.fullname || `User ${m.member_id.slice(0, 6)}`}
                                                </span>
                                                {m.club_role?.name && (
                                                    <span className="text-xs text-gray-400">{m.club_role.name}</span>
                                                )}
                                            </div>
                                            {club.president_id === m.member_id && (
                                                <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                                                    President
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                    {boardMembers.length === 0 && (
                                        <li className="text-sm text-gray-500">No board members assigned</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ── Sub-components ─────────────────────────────── */
function StatCard({ icon, label, value, color, highlight }: {
    icon: React.ReactNode; label: string; value: number; color: string; highlight?: boolean;
}) {
    return (
        <div className={`bg-white rounded-xl shadow-sm p-5 relative overflow-hidden ${highlight ? 'ring-2 ring-amber-300' : ''}`}>
            <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${color} opacity-10`} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-3`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        </div>
    );
}

function BreakdownRow({ label, count, total, color }: {
    label: string; count: number; total: number; color: string;
}) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-36">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-medium text-gray-900 w-10 text-right">{count}</span>
        </div>
    );
}

function EventRow({ event, isUpcoming }: { event: any; isUpcoming?: boolean }) {
    const date = new Date(event.start_at);
    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl ${isUpcoming ? 'bg-emerald-50' : 'bg-gray-50'}`}>
            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold flex-shrink-0 ${isUpcoming ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                }`}>
                <span className="text-[10px] uppercase leading-tight">{date.toLocaleDateString('en', { month: 'short' })}</span>
                <span className="text-lg leading-tight">{date.getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
                <p className={`font-medium truncate ${isUpcoming ? 'text-gray-900' : 'text-gray-500'}`}>{event.title}</p>
                {event.location && <p className="text-xs text-gray-400 truncate">{event.location}</p>}
            </div>
            {isUpcoming && (
                <span className="text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-100 rounded-lg whitespace-nowrap">
                    Upcoming
                </span>
            )}
        </div>
    );
}

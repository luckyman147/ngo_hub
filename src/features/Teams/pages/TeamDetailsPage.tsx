
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../Authentication/auth.context";
import Navbar from "../../../Global_Components/navBar";
import { toast } from "sonner";
import { Users, Lock, Globe, Plus, LogOut, UserPlus, Shield, Settings, Loader, Share2 } from "lucide-react";
import AddMemberModal from "../components/modals/AddMemberModal";
import CreateTeamTaskModal from "../components/modals/CreateTeamTaskModal";
import TeamTasksList from "../components/TeamTasksList";
import TeamMeetings from "../components/TeamMeetings";
import EditTeamModal from "../components/modals/EditTeamModal";
import TeamStrategy from "../components/TeamStrategy";
import TeamLinks from "../components/TeamLinks";
import ShareTeamModal from "../components/modals/ShareTeamModal";
import { useTeamDetails, useJoinTeam, useLeaveTeam, useDeleteTeam } from "../hooks/useTeams";
import { EXECUTIVE_LEVELS } from "../../../utils/roles";
import { Trash2 } from "lucide-react";


export default function TeamDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const { t } = useTranslation();
    const hasExecutiveRole = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '');

    const { data: team, isLoading: loading, refetch } = useTeamDetails(id, user?.id);
    const joinMutation = useJoinTeam();
    const leaveMutation = useLeaveTeam();
    const deleteMutation = useDeleteTeam();

    const handleJoin = async () => {
        if (!team || !user) return;
        try {
            await joinMutation.mutateAsync({ teamId: team.id, userId: user.id });
            toast.success("Welcome to the team!");
        } catch (error) {
            toast.error("Failed to join team");
        }
    };

    const handleLeave = async () => {
        if (!team || !user) return;
        if (!confirm("Are you sure you want to leave this team?")) return;
        try {
            await leaveMutation.mutateAsync({ teamId: team.id, userId: user.id });
            toast.success("Left team successfully");
        } catch (error) {
            toast.error("Failed to leave team");
        }
    };

    const handleDeleteTeam = async () => {
        if (!team) return;
        if (!confirm(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`)) return;
        try {
            await deleteMutation.mutateAsync(team.id);
            toast.success("Team deleted successfully");
            navigate('/teams');
        } catch (error) {
            toast.error("Failed to delete team");
        }
    };

    // State for Modals
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);


    // Helpers
    const isTeamAdmin = team?.created_by === user?.id;
    const canManageTeam = isTeamAdmin || hasExecutiveRole;

    // Regular members + exclusive roles can edit content (Strategy, Links, Tasks)

    if (loading) return <div>
        <Navbar />
        <main className="md:ml-64 pt-32 flex flex-col items-center justify-center text-center px-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader className="w-6 h-6 text-gray-500 animate-spin" />
                </div>
                <p className="text-gray-600 text-sm">Loading team details...</p>
            </div>
        </main>
    </div>;
    if (!team) return null;

    // Strict Access Control for Private Teams
    if (!team.is_public && !team.is_member && !hasExecutiveRole) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="md:ml-64 pt-32 flex flex-col items-center justify-center text-center px-4">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Private Team</h2>
                        <p className="text-gray-500 mb-6">This team is private. Only members and admins can view its contents.</p>
                        <button
                            onClick={() => navigate('/teams')}
                            className="w-full py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                            Return to Teams
                        </button>
                    </div>
                </main>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="md:ml-64 pt-16 md:pt-6">

                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <button
                            onClick={() => navigate('/teams')}
                            className="mb-4 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                        >
                            ← Back to Teams
                        </button>

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                                    {team.is_public ? (
                                        <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                            <Globe className="w-3 h-3" /> Public
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                                            <Lock className="w-3 h-3" /> Private
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-600 max-w-2xl">{team.description}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                {team.is_member || hasExecutiveRole ? (
                                    <>
                                        {canManageTeam && (
                                            <>
                                                <button
                                                    onClick={handleDeleteTeam}
                                                    className="flex items-center gap-2 px-4 py-2 text-red-600 bg-white border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300"
                                                    title="Delete Team"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                                <button
                                                    onClick={() => setIsEditTeamOpen(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                                >
                                                    <Settings className="w-4 h-4" /> Edit Team
                                                </button>
                                                <button
                                                    onClick={() => setIsAddMemberOpen(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                                                >
                                                    <UserPlus className="w-4 h-4" /> Add Member
                                                </button>
                                                <button
                                                    onClick={() => setIsShareModalOpen(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-(--color-myPrimary) border border-blue-100 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                                                >
                                                    <Share2 className="w-4 h-4" /> Share
                                                </button>
                                            </>
                                        )}
                                        {team.is_member && (
                                            <button
                                                onClick={handleLeave}
                                                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100"
                                            >
                                                <LogOut className="w-4 h-4" /> Leave
                                            </button>
                                        )}
                                    </>
                                ) : team.is_public ? (
                                    <button
                                        onClick={handleJoin}
                                        disabled={joinMutation.isPending}
                                        className="flex items-center gap-2 px-6 py-2 bg-(--color-myPrimary) text-white rounded-lg font-medium hover:bg-blue-700"
                                    >
                                        {joinMutation.isPending ? 'Joining...' : 'Join Team'}
                                    </button>
                                ) : (
                                    <button disabled className="px-6 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed">
                                        Private Team
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                    {/* Full Width Section: Tasks */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black flex items-center gap-2">
                                {t('profile.teamTasks')}

                            </h2>
                            {canManageTeam && (
                                <button
                                    onClick={() => setIsCreateTaskOpen(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-(--color-mySecondary) text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> {t('profile.newTask')}
                                </button>
                            )}
                        </div>

                        <TeamTasksList
                            teamId={team.id}
                            refreshTrigger={taskRefreshTrigger}
                            isAdmin={canManageTeam}
                            teamMembers={team.members?.map((m: any) => ({
                                id: m.member_id,
                                fullname: m.member?.fullname || 'Unknown',
                                avatar_url: m.member?.avatar_url
                            })) || []}
                        />
                    </div>

                    {/* Full Width Section: Meetings */}
                    <TeamMeetings teamId={team.id} canManage={canManageTeam} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content: Strategy & Links (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                            {(team.strategy || canManageTeam) && (
                                <TeamStrategy
                                    team={team}
                                    canManage={canManageTeam}
                                    onUpdated={refetch}
                                />
                            )}
                            {((team.resources?.length ?? 0) > 0 || canManageTeam) && (
                                <TeamLinks

                                    team={team}
                                    canManage={canManageTeam}
                                    onUpdated={refetch}
                                />
                            )}
                        </div>

                        {/* Sidebar: Members */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-gray-500" />
                                    Members
                                    <span className="text-gray-400 font-normal text-sm">({(team.members?.length ?? 0)})</span>
                                </h3>
                                <div className="space-y-3">
                                    {team.members?.map((tm: any) => (
                                        <div key={tm.id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    {tm.member?.avatar_url ? (
                                                        <img src={tm.member.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-gray-500">
                                                            {tm.member?.fullname?.substring(0, 2).toUpperCase() || "??"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{tm.member?.fullname}</p>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {(tm as any).custom_title || tm.role}
                                                    </p>
                                                </div>
                                            </div>
                                            {tm.role === 'admin' && <Shield className="w-3 h-3 text-blue-500" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                {/* Modals */}
                <AddMemberModal
                    open={isAddMemberOpen}
                    onClose={() => setIsAddMemberOpen(false)}
                    teamId={team.id}
                    existingMemberIds={team.members?.map((m: any) => m.member_id) || []}
                    onAdded={() => refetch()}
                    projectId={team.project_id}
                />

                <CreateTeamTaskModal
                    open={isCreateTaskOpen}
                    onClose={() => setIsCreateTaskOpen(false)}
                    teamId={team.id}
                    teamMembers={team.members?.map((m: any) => ({
                        id: m.member_id,
                        fullname: m.member?.fullname || 'Unknown',
                        avatar_url: m.member?.avatar_url
                    })) || []}
                    onCreated={() => setTaskRefreshTrigger(prev => prev + 1)}
                />

                <EditTeamModal
                    open={isEditTeamOpen}
                    onClose={() => setIsEditTeamOpen(false)}
                    team={team}
                    onUpdated={() => {
                        refetch();
                    }}
                />

                <ShareTeamModal
                    open={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    team={team}
                    onUpdated={refetch}
                />

            </main>
        </div>
    );
}


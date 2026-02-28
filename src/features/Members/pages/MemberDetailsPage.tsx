import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
    MemberHeader, 
    MemberStatus, 
    MemberPoints,
    MemberPointsProgress,
    MemberObjectives,
    MemberActivities,
    MemberComplaints,
    MemberStrengths,
    MemberWeaknesses,
    MemberInterests,
    MemberBio,
    MemberProfessionalInfo,
    MemberSocialInfo,
    MemberLifestyle,
    MemberEngagementPrefs,
    MemberPersonality,
    MemberAdvisor,
    MemberAISummary,
} from "../components";
import Navbar from "../../../Global_Components/navBar";
import MemberPointsHistory from "../components/stats/profile/MemberPointsHistory";
import { MemberTasksList } from "../../Tasks";
import { MemberTeamsList } from "../../Teams";
import { MemberJPSCard, MemberPerformanceComparison } from "../components";
import { useMember, useUpdateMember, useAddComplaint, useDeleteMember } from "../hooks/useMembers";
import type { Member } from "../types";
import { useAuth } from "../../Authentication/auth.context";
import { EXECUTIVE_LEVELS } from "../../../utils/roles";
import { Loader, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MemberDetailsPage() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { role, user } = useAuth();
    const canEdit = EXECUTIVE_LEVELS.includes(role?.toLowerCase() || '');
    
    // If we're on /me, use the current user's ID
    const effectiveId = id || user?.id;
    const isOwnProfile = user?.id === effectiveId;

    const { data: member, isLoading: loading } = useMember(effectiveId);
    const updateMutation = useUpdateMember();
    const complaintMutation = useAddComplaint();
    const deleteMutation = useDeleteMember();

    const handleUpdate = async (updates: Partial<Member>) => {
        if (!member) return;
        try {
            await updateMutation.mutateAsync({ id: member.id, updates });
            toast.success(t('profile.memberUpdated'));
        } catch (error) {
            toast.error(t('profile.updateFailed'));
        }
    };

    const handleDelete = async () => {
        if (!member) return;
        try {
            await deleteMutation.mutateAsync(member.id);
            toast.success(t('profile.memberDeleted'));
            navigate('/members');
        } catch (error) {
            toast.error(t('profile.deleteFailed'));
        }
    };
    
    const handleAddComplaint = async (content: string) => {
        if (!member) return;
        try {
            await complaintMutation.mutateAsync({ memberId: member.id, content });
            toast.success(t('profile.complaintAdded'));
        } catch (error) {
            toast.error(t('profile.complaintFailed'));
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">
        <Loader className="animate-spin inline-block mb-2" />
        <p>{t('profile.loadingDetails')}</p>
    </div>;

    if (!member) return null;

    return (
          <div className="min-h-screen bg-gray-50">
              <Navbar />
                <main className="md:ms-64 pt-16 md:pt-6 pb-24 md:pb-0">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <button 
                            onClick={() => navigate('/members')}
                            className="mb-6 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1 rtl:rotate-180" />
                            {t('profile.backToMembers')}
                        </button>

                        <div className="mb-8">
                            <MemberHeader 
                                member={member} 
                                rankPosition={member.rankPos?.toString() || member.role} 
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                            />
                            <MemberProfessionalInfo 
                                member={member} 
                                onUpdate={handleUpdate}
                                readOnly={!isOwnProfile && !canEdit}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                <MemberSocialInfo 
                                    member={member} 
                                    onUpdate={handleUpdate}
                                    readOnly={!isOwnProfile && !canEdit}
                                />
                                <MemberEngagementPrefs 
                                    member={member} 
                                    onUpdate={handleUpdate}
                                    readOnly={!isOwnProfile && !canEdit}
                                />
                           
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Left Column Stack */}
                            <div className="space-y-8">
                                <MemberStatus 
                                    isValidated={member.is_validated}
                                    cotisation={member.cotisation_status}
                                    onValidationChange={(val) => handleUpdate({ is_validated: val })}
                                    onCotisationChange={(cot) => handleUpdate({ cotisation_status: cot })}
                                    readOnly={!canEdit}
                                />
                                
                                <MemberPoints 
                                    points={member.points}
                                    onPointsChange={(pts) => handleUpdate({ points: pts })}
                                    readOnly={!canEdit}
                                />

                                <MemberAdvisor 
                                    member={member}
                                    onUpdate={handleUpdate}
                                    canEdit={canEdit}
                                />

                              
                            </div>

                            {/* Right Column Stack */}
                            <div className="space-y-8 ">
                                  <MemberInterests 
                                    memberId={member.id}
                                    readOnly={!isOwnProfile && !canEdit}
                                />
                                <MemberBio 
                                    description={member.description}
                                    onUpdate={(desc) => handleUpdate({ description: desc })}
                                    readOnly={!isOwnProfile && !canEdit}
                                />

                                <MemberAISummary member={member} readOnly={!isOwnProfile && !canEdit} />

                                <MemberLifestyle 
                                    member={member} 
                                    onUpdate={handleUpdate}
                                    readOnly={!isOwnProfile && !canEdit}
                                />
                            </div>
                            
                            <div className="lg:col-span-2 space-y-8">
                                <MemberJPSCard memberId={member.id} />
                                <MemberPerformanceComparison memberId={member.id} />
                            </div>

                            {/* Full Width Sections */}
                            <div className="lg:col-span-2">
                                <MemberPersonality 
                                    type={member.personality_type}
                                    onUpdate={(type) => handleUpdate({ personality_type: type })}
                                    readOnly={!isOwnProfile && !canEdit}
                                />
                            </div>
                            
                            <div className="lg:col-span-1">
                                <MemberStrengths 
                                    strengths={member.strengths || []}
                                    onUpdate={(str: string[]) => handleUpdate({ strengths: str })}
                                    readOnly={!isOwnProfile && !canEdit}
                                />
                            </div>
                            
                            <div className="lg:col-span-1">
                                <MemberWeaknesses 
                                    weaknesses={member.weaknesses || []}
                                    onUpdate={(weak: string[]) => handleUpdate({ weaknesses: weak })}
                                    readOnly={!isOwnProfile && !canEdit}
                                />
                            </div>
   
                            {/* Bottom Full-Width Sections */}
                            <div className="space-y-8 lg:col-span-2">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <MemberPointsProgress memberId={member.id} currentPoints={member.points} />
                                    <MemberObjectives memberId={member.id} isAdmin={canEdit} />
                                </div>
                                
                                <MemberActivities memberId={member.id} />
                                <MemberTasksList memberId={member.id} isAdmin={canEdit} />
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <MemberTeamsList memberId={member.id} />
                                    <MemberComplaints 
                                        complaints={member.complaints || []}
                                        onAddComplaint={handleAddComplaint}
                                        readOnly={!isOwnProfile}
                                    />
                                </div>
                                <MemberPointsHistory memberId={member.id} />
                            </div>
                        </div>
                    </div>
                </main>
          </div>
    );
}

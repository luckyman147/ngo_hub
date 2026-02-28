import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, ArrowLeft, UserPlus, Check, X, MoreVertical, BarChart3, FolderKanban, Plus, Trash2, UserCheck, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navbar from '../../../Global_Components/navBar';
import supabase from '../../../utils/supabase';
import {
  getClubById,
  requestToJoinClub,
  approveMember,
  rejectMember,
  assignMemberRole,
  getClubRoles,
  createClubRole,
  setBoardMember,
} from '../services/clubs.service';
import { getClubEvents } from '../services/clubEvents.service';
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
  requestJoinDepartment,
  approveDeptMember,
  rejectDeptMember,
} from '../services/clubDepartments.service';
import CreateClubEventForm from '../components/CreateClubEventForm';
import ClubEventCard from '../components/ClubEventCard';
import AddClubMemberModal from '../components/modals/AddClubMemberModal';
import { useAuth } from '../../Authentication/auth.context';
import type { ClubMember } from '../types';

export default function ClubDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [joinMessage, setJoinMessage] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [assigningMember, setAssigningMember] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [showCreateDept, setShowCreateDept] = useState(false);

  const { data: club, isLoading, error } = useQuery({
    queryKey: ['club', id],
    queryFn: () => getClubById(id!),
    enabled: !!id,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['club-roles', id],
    queryFn: () => getClubRoles(id!),
    enabled: !!id && !!club,
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
  const canManageClub = isPresident || isBoardMember;
  const members = (club as any)?.members ?? [];

  // Enrich members with profile data
  const [profileMap, setProfileMap] = useState<Record<string, { fullname?: string; email?: string }>>({});
  useEffect(() => {
    const ids = [...new Set(members.map((m: ClubMember) => m.member_id))];
    if (ids.length === 0) return;
    supabase
      .from('profiles')
      .select('id, fullname, email')
      .in('id', ids)
      .then(({ data }) => {
        const map: Record<string, { fullname?: string; email?: string }> = {};
        (data ?? []).forEach((p: any) => {
          map[p.id] = { fullname: p.fullname, email: p.email };
        });
        setProfileMap(map);
      });
  }, [members.length, id]);
  const acceptedMembers = members.filter((m: ClubMember) => m.status === 'accepted');
  const pendingMembers = members.filter((m: ClubMember) => m.status === 'pending');

  const joinMutation = useMutation({
    mutationFn: () => requestToJoinClub(id!, joinMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', id] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setShowJoinModal(false);
      toast.success('Request sent. The president will review it.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId?: string }) =>
      approveMember(id!, memberId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', id] });
      toast.success('Member approved');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (memberId: string) => rejectMember(id!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', id] });
      toast.success('Request rejected');
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      assignMemberRole(id!, memberId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', id] });
      setAssigningMember(null);
      toast.success('Role assigned');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createRoleMutation = useMutation({
    mutationFn: (name: string) => createClubRole(id!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-roles', id] });
      setNewRoleName('');
      toast.success('Role created');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setBoardMemberMutation = useMutation({
    mutationFn: ({ memberId, value }: { memberId: string; value: boolean }) => setBoardMember(id!, memberId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club', id] });
      setAssigningMember(null);
      toast.success('Board member access updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Department mutations
  const createDeptMutation = useMutation({
    mutationFn: () => createDepartment(id!, newDeptName, newDeptDesc || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-departments', id] });
      setNewDeptName('');
      setNewDeptDesc('');
      setShowCreateDept(false);
      toast.success('Department created');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteDeptMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-departments', id] });
      toast.success('Department deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const joinDeptMutation = useMutation({
    mutationFn: requestJoinDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-departments', id] });
      toast.success('Join request sent!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveDeptMemberMutation = useMutation({
    mutationFn: approveDeptMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-departments', id] });
      toast.success('Member approved');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectDeptMemberMutation = useMutation({
    mutationFn: rejectDeptMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-departments', id] });
      toast.success('Member rejected');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-myPrimary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Club not found</p>
        <button onClick={() => navigate('/clubs')} className="text-[var(--color-myPrimary)] font-medium">
          Back to Clubs
        </button>
      </div>
    );
  }

  const nonPresidentRoles = roles.filter((r) => !r.is_president);
  const canJoin =
    user &&
    !club.is_member &&
    !members.some((m: ClubMember) => m.member_id === user.id && m.status === 'pending');

  const isMember = club.my_status === 'accepted';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6 pb-24 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={() => navigate('/clubs')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Clubs
          </button>

          {/* Club header */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <Building2 className="w-8 h-8 text-[var(--color-myPrimary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
                {club.description && <p className="text-gray-600 mt-2">{club.description}</p>}
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                    <Users className="w-4 h-4" /> {club.member_count ?? 0} members
                  </span>
                  {club.my_status === 'accepted' && (
                    <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                      Member {club.my_role?.name && `• ${club.my_role.name}`}
                    </span>
                  )}
                  {club.my_status === 'pending' && (
                    <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium">
                      Pending approval
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  {canJoin && (
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-myPrimary)] text-white font-semibold text-sm hover:opacity-90 transition"
                    >
                      <UserPlus className="w-4 h-4" /> Request to Join
                    </button>
                  )}
                  {canManageClub && (
                    <button
                      onClick={() => navigate(`/clubs/${id}/dashboard`)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition"
                    >
                      <BarChart3 className="w-4 h-4" /> Dashboard
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pending requests */}
          {canManageClub && pendingMembers.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
              <h2 className="font-bold text-gray-900 mb-4">Pending requests</h2>
              <ul className="space-y-3">
                {pendingMembers.map((m: ClubMember) => (
                  <li key={m.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {(m.member as any)?.fullname ?? profileMap[m.member_id]?.fullname ?? `Member ${m.member_id.slice(0, 8)}`}
                      </p>
                      {m.message && <p className="text-sm text-gray-500">{m.message}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {nonPresidentRoles.length > 0 ? (
                        <select
                          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                          onChange={(e) => {
                            const rid = e.target.value;
                            if (rid) approveMutation.mutate({ memberId: m.member_id, roleId: rid });
                          }}
                        >
                          <option value="">Approve as…</option>
                          {nonPresidentRoles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => approveMutation.mutate({ memberId: m.member_id })}
                          disabled={approveMutation.isPending}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => rejectMutation.mutate(m.member_id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Create event */}
          {canManageClub && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
              <h2 className="font-bold text-gray-900 mb-4">Create Event</h2>
              <CreateClubEventForm clubId={id!} />
            </div>
          )}

          {/* Events list */}
          {events.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
              <h2 className="font-bold text-gray-900 mb-4">Upcoming Events</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {events.map((ev: any) => (
                  <ClubEventCard key={ev.id} event={ev} />
                ))}
              </div>
            </div>
          )}

          {/* ────────────────────────────────────── */}
          {/* DEPARTMENTS                            */}
          {/* ────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-purple-500" />
                Departments
              </h2>
              {canManageClub && (
                <button
                  onClick={() => setShowCreateDept(!showCreateDept)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </button>
              )}
            </div>

            {/* Create department form */}
            {showCreateDept && canManageClub && (
              <div className="p-4 bg-gray-50 rounded-xl mb-4 space-y-2">
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Department name *"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                />
                <input
                  type="text"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Short description"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowCreateDept(false); setNewDeptName(''); setNewDeptDesc(''); }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => newDeptName.trim() && createDeptMutation.mutate()}
                    disabled={!newDeptName.trim() || createDeptMutation.isPending}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                  >
                    {createDeptMutation.isPending ? 'Creating…' : 'Create Department'}
                  </button>
                </div>
              </div>
            )}

            {departments.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                {canManageClub ? 'No departments yet. Create one above.' : 'No departments have been created yet.'}
              </p>
            ) : (
              <div className="space-y-3">
                {departments.map((dept: any) => {
                  const myDeptMembership = dept.members?.find((m: any) => m.member_id === user?.id);
                  const pendingDeptMembers = dept.members?.filter((m: any) => m.status === 'pending') ?? [];
                  const acceptedDeptMembers = dept.members?.filter((m: any) => m.status === 'accepted') ?? [];
                  const alreadyRequested = !!myDeptMembership;
                  const isAccepted = myDeptMembership?.status === 'accepted';

                  return (
                    <div key={dept.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                          {dept.description && <p className="text-sm text-gray-500 mt-0.5">{dept.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="flex items-center gap-1 text-emerald-600">
                              <UserCheck className="w-3.5 h-3.5" /> {acceptedDeptMembers.length} members
                            </span>
                            {canManageClub && pendingDeptMembers.length > 0 && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Clock className="w-3.5 h-3.5" /> {pendingDeptMembers.length} pending
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isMember && !canManageClub && !alreadyRequested && (
                            <button
                              onClick={() => joinDeptMutation.mutate(dept.id)}
                              disabled={joinDeptMutation.isPending}
                              className="px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                            >
                              Request to Join
                            </button>
                          )}
                          {alreadyRequested && !isAccepted && (
                            <span className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg">Pending</span>
                          )}
                          {isAccepted && !canManageClub && (
                            <span className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg">Member</span>
                          )}
                          {canManageClub && (
                            <button
                              onClick={() => deleteDeptMutation.mutate(dept.id)}
                              className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete department"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Pending members for board view */}
                      {canManageClub && pendingDeptMembers.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase">Pending Join Requests</p>
                          {pendingDeptMembers.map((dm: any) => (
                            <div key={dm.id} className="flex items-center justify-between py-1">
                              <span className="text-sm text-gray-700">
                                {profileMap[dm.member_id]?.fullname || `User ${dm.member_id.slice(0, 6)}`}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => approveDeptMemberMutation.mutate(dm.id)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => rejectDeptMemberMutation.mutate(dm.id)}
                                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Roles (president only) */}
          {isPresident && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
              <h2 className="font-bold text-gray-900 mb-4">Club roles</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {roles.map((r) => (
                  <span
                    key={r.id}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${r.is_president ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {r.name}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="New role (e.g. Vice-President)"
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm"
                />
                <button
                  onClick={() => newRoleName.trim() && createRoleMutation.mutate(newRoleName.trim())}
                  disabled={!newRoleName.trim() || createRoleMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900">Members</h2>
              {canManageClub && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[var(--color-myPrimary)] text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> Add Users
                </button>
              )}
            </div>
            {acceptedMembers.length === 0 ? (
              <p className="text-gray-500 text-sm">No members yet.</p>
            ) : (
              <ul className="space-y-3">
                {acceptedMembers.map((m: ClubMember) => (
                  <li key={m.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {(m.member as any)?.fullname ?? profileMap[m.member_id]?.fullname ?? `Member ${m.member_id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {m.club_role?.name ?? 'Member'}
                        {m.is_board_member && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-medium">Board</span>
                        )}
                      </p>
                    </div>
                    {(isPresident || isBoardMember) && !m.club_role?.is_president && (
                      <div className="relative">
                        <button
                          onClick={() => setAssigningMember(assigningMember === m.member_id ? null : m.member_id)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {assigningMember === m.member_id && (
                          <div className="absolute right-0 top-full mt-1 py-2 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-[180px]">
                            {nonPresidentRoles.map((r) => (
                              <button
                                key={r.id}
                                onClick={() => assignRoleMutation.mutate({ memberId: m.member_id, roleId: r.id })}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Assign {r.name}
                              </button>
                            ))}
                            {isPresident && (
                              <button
                                onClick={() => setBoardMemberMutation.mutate({ memberId: m.member_id, value: !m.is_board_member })}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100 mt-1"
                              >
                                {m.is_board_member ? 'Remove from board' : 'Make board member'}
                              </button>
                            )}
                            {nonPresidentRoles.length === 0 && !isPresident && (
                              <p className="px-4 py-2 text-sm text-gray-500">Create roles first</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Add Members Modal */}
      <AddClubMemberModal
        open={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        clubId={id!}
        existingMemberIds={members.map((m: any) => m.member_id)}
        onAdded={() => queryClient.invalidateQueries({ queryKey: ['club', id] })}
      />

      {/* Join modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-gray-900 mb-4">Request to join {club.name}</h3>
            <textarea
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder="Optional message to the president..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 resize-none focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-myPrimary)] text-white font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {joinMutation.isPending ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

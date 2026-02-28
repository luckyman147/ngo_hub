import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowLeft, Building2, Users, UserPlus, Check, X, MoreVertical,
  FolderTree, Shield, ChevronDown, ChevronRight, Trash2, Network
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../../../Global_Components/navBar';
import { getNGOById } from '../services/ngo.service';
import { getUnitTypes, getUnits, buildUnitTree, createUnitType, createUnit, deleteUnit, deleteUnitType } from '../services/ngoUnits.service';
import { getRoles, createRole, deleteRole, ALL_PERMISSIONS } from '../services/ngoRoles.service';
import { getMembers, requestJoinNGO, approveMember, rejectMember, assignRole, assignUnit, removeMember } from '../services/ngoMembers.service';
import { useAuth } from '../../Authentication/auth.context';
import type { NGOUnit } from '../services/ngoUnits.service';

export default function NGODetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [tab, setTab] = useState<'overview' | 'units' | 'roles' | 'members'>('overview');
  const [newUnitTypeName, setNewUnitTypeName] = useState('');
  const [newUnitTypeLevel, setNewUnitTypeLevel] = useState(0);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitTypeId, setNewUnitTypeId] = useState('');
  const [newUnitParentId, setNewUnitParentId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [assigningMember, setAssigningMember] = useState<string | null>(null);

  const { data: ngo, isLoading } = useQuery({ queryKey: ['ngo', id], queryFn: () => getNGOById(id!), enabled: !!id });
  const { data: unitTypes = [] } = useQuery({ queryKey: ['ngo-unit-types', id], queryFn: () => getUnitTypes(id!), enabled: !!id });
  const { data: units = [] } = useQuery({ queryKey: ['ngo-units', id], queryFn: () => getUnits(id!), enabled: !!id });
  const { data: roles = [] } = useQuery({ queryKey: ['ngo-roles', id], queryFn: () => getRoles(id!), enabled: !!id });
  const { data: members = [] } = useQuery({ queryKey: ['ngo-members', id], queryFn: () => getMembers(id!), enabled: !!id });

  const unitTree = buildUnitTree(units);
  const isCreator = ngo && user && ngo.creator_id === user.id;
  const myMembership = members.find((m) => m.member_id === user?.id);
  const isAdmin = isCreator || myMembership?.role?.is_admin;
  const canJoin = user && !myMembership;
  const acceptedMembers = members.filter((m) => m.status === 'accepted');
  const pendingMembers = members.filter((m) => m.status === 'pending');

  const inv = (key: string) => () => qc.invalidateQueries({ queryKey: [key, id] });

  const joinMutation = useMutation({ mutationFn: () => requestJoinNGO(id!), onSuccess: () => { inv('ngo-members')(); toast.success('Join request sent!'); }, onError: (e: Error) => toast.error(e.message) });
  const approveMut = useMutation({ mutationFn: approveMember, onSuccess: () => { inv('ngo-members')(); toast.success('Approved'); }, onError: (e: Error) => toast.error(e.message) });
  const rejectMut = useMutation({ mutationFn: rejectMember, onSuccess: () => { inv('ngo-members')(); toast.success('Removed'); }, onError: (e: Error) => toast.error(e.message) });
  const removeMut = useMutation({ mutationFn: removeMember, onSuccess: () => { inv('ngo-members')(); toast.success('Removed'); }, onError: (e: Error) => toast.error(e.message) });
  const assignRoleMut = useMutation({ mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) => assignRole(memberId, roleId), onSuccess: () => { inv('ngo-members')(); setAssigningMember(null); toast.success('Role assigned'); }, onError: (e: Error) => toast.error(e.message) });
  const assignUnitMut = useMutation({ mutationFn: ({ memberId, unitId }: { memberId: string; unitId: string }) => assignUnit(memberId, unitId), onSuccess: () => { inv('ngo-members')(); toast.success('Unit assigned'); }, onError: (e: Error) => toast.error(e.message) });
  const createUnitTypeMut = useMutation({ mutationFn: () => createUnitType(id!, newUnitTypeName, newUnitTypeLevel), onSuccess: () => { inv('ngo-unit-types')(); setNewUnitTypeName(''); toast.success('Unit type created'); }, onError: (e: Error) => toast.error(e.message) });
  const createUnitMut = useMutation({ mutationFn: () => createUnit(id!, newUnitTypeId, newUnitName, newUnitParentId || undefined), onSuccess: () => { inv('ngo-units')(); setNewUnitName(''); toast.success('Unit created'); }, onError: (e: Error) => toast.error(e.message) });
  const deleteUnitMut = useMutation({ mutationFn: deleteUnit, onSuccess: () => { inv('ngo-units')(); toast.success('Deleted'); }, onError: (e: Error) => toast.error(e.message) });
  const deleteUnitTypeMut = useMutation({ mutationFn: deleteUnitType, onSuccess: () => { inv('ngo-unit-types')(); toast.success('Deleted'); }, onError: (e: Error) => toast.error(e.message) });
  const createRoleMut = useMutation({ mutationFn: () => createRole(id!, newRoleName, newRolePerms), onSuccess: () => { inv('ngo-roles')(); setNewRoleName(''); setNewRolePerms([]); toast.success('Role created'); }, onError: (e: Error) => toast.error(e.message) });
  const deleteRoleMut = useMutation({ mutationFn: deleteRole, onSuccess: () => { inv('ngo-roles')(); toast.success('Deleted'); }, onError: (e: Error) => toast.error(e.message) });

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[var(--color-myPrimary)] border-t-transparent rounded-full" /></div>;
  if (!ngo) return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4"><p className="text-gray-600">Organization not found</p><button onClick={() => navigate('/clubs')} className="text-[var(--color-myPrimary)] font-medium">Back</button></div>;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'units', label: 'Structure', icon: Network },
    { key: 'roles', label: 'Roles', icon: Shield },
    { key: 'members', label: `Members (${acceptedMembers.length})`, icon: Users },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6 pb-24 md:pb-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                {ngo.logo_url ? <img src={ngo.logo_url} className="w-full h-full rounded-2xl object-cover" /> : <Building2 className="w-8 h-8 text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{ngo.name}</h1>
                <p className="text-gray-600 mt-1">{ngo.mission}</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-sm text-gray-500"><Users className="w-4 h-4" />{acceptedMembers.length} members</span>
                  <span className="inline-flex items-center gap-1 text-sm text-gray-500"><Network className="w-4 h-4" />{units.length} units</span>
                  {myMembership?.status === 'accepted' && <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">{myMembership.role?.name || 'Member'}</span>}
                  {myMembership?.status === 'pending' && <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium">Pending</span>}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  {canJoin && <button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-myPrimary)] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60"><UserPlus className="w-4 h-4" />{joinMutation.isPending ? 'Sending…' : 'Request to Join'}</button>}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-[var(--color-myPrimary)] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {/* ──────── OVERVIEW ──────── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {ngo.description && <div className="bg-white rounded-2xl shadow-sm p-6"><h2 className="font-bold text-gray-900 mb-2">About</h2><p className="text-gray-600">{ngo.description}</p></div>}
              {ngo.causes?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 mb-3">Causes</h2>
                  <div className="flex flex-wrap gap-2">{ngo.causes.map((c: string) => <span key={c} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">{c}</span>)}</div>
                </div>
              )}
              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatBox label="Members" value={acceptedMembers.length} color="from-blue-500 to-blue-600" />
                <StatBox label="Pending" value={pendingMembers.length} color="from-amber-500 to-orange-500" />
                <StatBox label="Units" value={units.length} color="from-emerald-500 to-green-600" />
                <StatBox label="Roles" value={roles.length} color="from-purple-500 to-violet-600" />
              </div>
              {/* Unit type summary */}
              {unitTypes.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 mb-3">Organization Structure</h2>
                  <div className="flex flex-wrap gap-2">
                    {unitTypes.map((ut) => <span key={ut.id} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">Level {ut.level}: {ut.name}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────── STRUCTURE TAB ──────── */}
          {tab === 'units' && (
            <div className="space-y-6">
              {/* Unit Types */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FolderTree className="w-5 h-5 text-blue-500" /> Unit Types</h2>
                <p className="text-sm text-gray-500 mb-4">Define what your organization calls its structural levels. Examples: Chapter, Branch, Department, Committee, Team, Commission, Task Force…</p>
                {unitTypes.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {unitTypes.map((ut) => (
                      <div key={ut.id} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl">
                        <div><span className="font-medium text-gray-900">{ut.name}</span><span className="ml-2 text-xs text-gray-400">Level {ut.level}</span></div>
                        {isAdmin && <button onClick={() => deleteUnitTypeMut.mutate(ut.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    ))}
                  </div>
                )}
                {isAdmin && (
                  <div className="flex gap-2">
                    <input type="text" value={newUnitTypeName} onChange={(e) => setNewUnitTypeName(e.target.value)} placeholder="Type name (e.g. Chapter)" className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
                    <input type="number" value={newUnitTypeLevel} onChange={(e) => setNewUnitTypeLevel(Number(e.target.value))} placeholder="Level" className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm text-center" min={0} />
                    <button onClick={() => newUnitTypeName.trim() && createUnitTypeMut.mutate()} disabled={!newUnitTypeName.trim()} className="px-4 py-2 bg-[var(--color-myPrimary)] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50">Add</button>
                  </div>
                )}
              </div>

              {/* Units Tree */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Network className="w-5 h-5 text-emerald-500" /> Units</h2>
                {unitTree.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">{unitTypes.length === 0 ? 'Define unit types first, then create units.' : 'No units yet. Create one below.'}</p>
                ) : (
                  <div className="space-y-1 mb-4">
                    {unitTree.map((u) => <UnitNode key={u.id} unit={u} depth={0} isAdmin={!!isAdmin} onDelete={(uid) => deleteUnitMut.mutate(uid)} />)}
                  </div>
                )}
                {isAdmin && unitTypes.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    <select value={newUnitTypeId} onChange={(e) => setNewUnitTypeId(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                      <option value="">Type…</option>
                      {unitTypes.map((ut) => <option key={ut.id} value={ut.id}>{ut.name}</option>)}
                    </select>
                    <select value={newUnitParentId} onChange={(e) => setNewUnitParentId(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                      <option value="">No parent (root)</option>
                      {units.map((u) => <option key={u.id} value={u.id}>{u.unit_type?.name}: {u.name}</option>)}
                    </select>
                    <input type="text" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder="Unit name" className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm" />
                    <button onClick={() => newUnitName.trim() && newUnitTypeId && createUnitMut.mutate()} disabled={!newUnitName.trim() || !newUnitTypeId} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50">Create</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────── ROLES TAB ──────── */}
          {tab === 'roles' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-purple-500" /> Roles & Permissions</h2>
                {roles.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {roles.map((r) => (
                      <div key={r.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                            <span className="font-semibold text-gray-900">{r.name}</span>
                            {r.is_admin && <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold">Admin</span>}
                          </div>
                          {isAdmin && !r.is_admin && <button onClick={() => deleteRoleMut.mutate(r.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {r.permissions.map((p) => {
                            const perm = ALL_PERMISSIONS.find((ap) => ap.key === p);
                            return <span key={p} className="px-2 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-600">{perm?.label ?? p}</span>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isAdmin && (
                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <h3 className="font-semibold text-gray-900 text-sm">Create New Role</h3>
                    <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Role name (e.g. Event Manager)" className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_PERMISSIONS.filter((p) => p.key !== 'all').map((p) => (
                        <label key={p.key} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${newRolePerms.includes(p.key) ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={newRolePerms.includes(p.key)} onChange={(e) => setNewRolePerms(e.target.checked ? [...newRolePerms, p.key] : newRolePerms.filter((x) => x !== p.key))} className="sr-only" />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${newRolePerms.includes(p.key) ? 'bg-[var(--color-myPrimary)] border-[var(--color-myPrimary)] text-white' : 'border-gray-300'}`}>
                            {newRolePerms.includes(p.key) && <Check className="w-3 h-3" />}
                          </div>
                          <div><span className="font-medium">{p.label}</span><p className="text-xs text-gray-400">{p.desc}</p></div>
                        </label>
                      ))}
                    </div>
                    <button onClick={() => newRoleName.trim() && createRoleMut.mutate()} disabled={!newRoleName.trim() || newRolePerms.length === 0} className="px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50">Create Role</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────── MEMBERS TAB ──────── */}
          {tab === 'members' && (
            <div className="space-y-6">
              {/* Pending */}
              {isAdmin && pendingMembers.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 mb-4">Pending Requests ({pendingMembers.length})</h2>
                  <ul className="space-y-2">
                    {pendingMembers.map((m) => (
                      <li key={m.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-sm font-bold">{(m.profile?.fullname || '?').charAt(0)}</div>
                          <div><p className="font-medium text-gray-900">{m.profile?.fullname || 'User'}</p><p className="text-xs text-gray-500">{m.profile?.email}</p></div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => approveMut.mutate(m.id)} className="p-2 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                          <button onClick={() => rejectMut.mutate(m.id)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"><X className="w-4 h-4" /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Accepted */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4">Members</h2>
                {acceptedMembers.length === 0 ? <p className="text-gray-500 text-sm text-center py-4">No members yet.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-2 font-semibold text-gray-500">Name</th>
                        <th className="text-left py-3 px-2 font-semibold text-gray-500">Role</th>
                        <th className="text-left py-3 px-2 font-semibold text-gray-500">Unit</th>
                        <th className="text-left py-3 px-2 font-semibold text-gray-500">Points</th>
                        {isAdmin && <th className="text-right py-3 px-2 font-semibold text-gray-500">Actions</th>}
                      </tr></thead>
                      <tbody>
                        {acceptedMembers.map((m) => (
                          <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">{(m.profile?.fullname || '?').charAt(0)}</div>
                                <div><p className="font-medium text-gray-900">{m.profile?.fullname || 'User'}</p><p className="text-xs text-gray-400">{m.profile?.email}</p></div>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              {m.role ? <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ backgroundColor: m.role.color + '22', color: m.role.color }}>{m.role.name}</span> : <span className="text-gray-400 text-xs">—</span>}
                            </td>
                            <td className="py-3 px-2"><span className="text-gray-600 text-xs">{m.unit?.name || '—'}</span></td>
                            <td className="py-3 px-2"><span className="text-gray-900 font-medium">{m.engagement_points}</span></td>
                            {isAdmin && (
                              <td className="py-3 px-2 text-right">
                                <div className="relative inline-block">
                                  <button onClick={() => setAssigningMember(assigningMember === m.id ? null : m.id)} className="p-1.5 rounded-lg hover:bg-gray-100"><MoreVertical className="w-4 h-4 text-gray-400" /></button>
                                  {assigningMember === m.id && (
                                    <div className="absolute right-0 top-full mt-1 py-2 bg-white rounded-xl border border-gray-200 shadow-lg z-20 min-w-[200px]">
                                      <p className="px-3 pb-1 text-xs font-semibold text-gray-400 uppercase">Assign Role</p>
                                      {roles.map((r) => <button key={r.id} onClick={() => assignRoleMut.mutate({ memberId: m.id, roleId: r.id })} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">{r.name}</button>)}
                                      {units.length > 0 && (<><hr className="my-1" /><p className="px-3 pb-1 text-xs font-semibold text-gray-400 uppercase">Assign Unit</p>{units.map((u) => <button key={u.id} onClick={() => assignUnitMut.mutate({ memberId: m.id, unitId: u.id })} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">{u.unit_type?.name}: {u.name}</button>)}</>)}
                                      <hr className="my-1" />
                                      <button onClick={() => { removeMut.mutate(m.id); setAssigningMember(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Remove member</button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Helper Components ─────────────── */
function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 relative overflow-hidden">
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${color} opacity-10`} />
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function UnitNode({ unit, depth, isAdmin, onDelete }: { unit: NGOUnit; depth: number; isAdmin: boolean; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = unit.children && unit.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors" style={{ paddingLeft: `${depth * 24 + 12}px` }}>
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : <span className="w-4" />}
        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs font-bold">{unit.unit_type?.name}</span>
        <span className="font-medium text-gray-900">{unit.name}</span>
        {isAdmin && <button onClick={() => onDelete(unit.id)} className="ml-auto text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>}
      </div>
      {expanded && hasChildren && unit.children!.map((c) => <UnitNode key={c.id} unit={c} depth={depth + 1} isAdmin={isAdmin} onDelete={onDelete} />)}
    </div>
  );
}

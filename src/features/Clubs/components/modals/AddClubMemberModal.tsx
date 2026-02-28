import { useState, useEffect } from "react";
import { X, Search, Check, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../../lib/utils";
import supabase from "../../../../utils/supabase";

interface AddClubMemberModalProps {
    open: boolean;
    onClose: () => void;
    clubId: string;
    existingMemberIds: string[];
    onAdded: () => void;
}

export default function AddClubMemberModal({ open, onClose, clubId, existingMemberIds, onAdded }: AddClubMemberModalProps) {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (open) {
            loadMembers();
            setSelectedIds([]);
            setSearch("");
        }
    }, [open]);

    const loadMembers = async () => {
        setLoading(true);
        try {
            // Get all platform users from profiles
            const { data, error } = await supabase.from('profiles').select('id, fullname, email, avatar_url');
            if (error) throw error;

            // Filter out already in club (either pending or accepted)
            setMembers((data || []).filter(m => !existingMemberIds.includes(m.id)));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(mid => mid !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleAdd = async () => {
        if (selectedIds.length === 0) return;
        setAdding(true);
        try {
            const inserts = selectedIds.map(mid => ({
                club_id: clubId,
                member_id: mid,
                status: 'accepted'
            }));

            const { error } = await supabase.from('club_members').insert(inserts);
            if (error) throw error;

            toast.success(`Directly added ${selectedIds.length} members to the club`);
            onAdded();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to add members");
        } finally {
            setAdding(false);
        }
    };

    const filteredMembers = members.filter(m =>
        (m.fullname || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.email || "").toLowerCase().includes(search.toLowerCase())
    );

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center p-5 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Add Members Directly</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b bg-gray-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-myPrimary)] outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="p-4 text-center text-gray-400">Loading users...</div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            {members.length === 0 ? "All platform users are already in this club." : "No users found."}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredMembers.map(member => {
                                const isSelected = selectedIds.includes(member.id);
                                return (
                                    <div
                                        key={member.id}
                                        onClick={() => toggleSelection(member.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                            isSelected ? "bg-blue-50 border-blue-100 ring-1 ring-[var(--color-myPrimary)]" : "hover:bg-gray-50 border border-transparent"
                                        )}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-bold text-gray-500">
                                                    {(member.fullname || "U").substring(0, 2).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate">{member.fullname || "Unknown User"}</h4>
                                            <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-[var(--color-myPrimary)] border-[var(--color-myPrimary)]' : 'border-gray-300'}`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t bg-gray-50 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        {selectedIds.length} selected
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={adding || selectedIds.length === 0}
                            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-myPrimary)] text-white font-medium rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UserPlus className="w-4 h-4" />
                            {adding ? 'Adding...' : 'Add Selected'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

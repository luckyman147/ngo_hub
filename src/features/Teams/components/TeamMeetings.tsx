import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Video, Calendar, Clock, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { getTeamMeetings, deleteTeamMeeting, createTeamMeeting } from "../services/meetings.service";

export function CreateMeetingModal({ open, onClose, teamId, onCreated }: { open: boolean, onClose: () => void, teamId: string, onCreated: () => void }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [link, setLink] = useState("");

    const createMutation = useMutation({
        mutationFn: async () => {
            const meetingDate = new Date(`${date}T${time}`).toISOString();
            return createTeamMeeting({
                team_id: teamId,
                title,
                description,
                meeting_date: meetingDate,
                meeting_link: link
            });
        },
        onSuccess: () => {
            toast.success("Meeting scheduled");
            onCreated();
            onClose();
        },
        onError: (err: any) => toast.error(err.message)
    });

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Schedule Meeting</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Weekly Sync"
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[var(--color-myPrimary)] outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[var(--color-myPrimary)] outline-none resize-none"
                            rows={2}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[var(--color-myPrimary)] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[var(--color-myPrimary)] outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (e.g. Google Meet)</label>
                        <input
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://meet.google.com/..."
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[var(--color-myPrimary)] outline-none"
                        />
                    </div>
                </div>
                <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => createMutation.mutate()}
                        disabled={!title || !date || !time || createMutation.isPending}
                        className="px-5 py-2 bg-[var(--color-myPrimary)] text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors"
                    >
                        {createMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TeamMeetings({ teamId, canManage }: { teamId: string, canManage: boolean }) {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: meetings = [], isLoading } = useQuery({
        queryKey: ["team-meetings", teamId],
        queryFn: () => getTeamMeetings(teamId),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTeamMeeting,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-meetings", teamId] });
            toast.success("Meeting cancelled");
        }
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black flex items-center gap-2">
                    <Video className="w-5 h-5 text-[var(--color-myPrimary)]" />
                    Team Meetings
                </h2>
                {canManage && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-mySecondary)] text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Schedule
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center p-6"><div className="animate-spin w-6 h-6 border-2 border-[var(--color-myPrimary)] border-t-transparent rounded-full" /></div>
            ) : meetings.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium text-sm">No upcoming meetings scheduled</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {meetings.map((meeting) => {
                        const mDate = new Date(meeting.meeting_date);
                        const isPast = mDate < new Date();

                        return (
                            <div key={meeting.id} className={`flex items-start justify-between p-4 rounded-xl border ${isPast ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-gray-200 hover:border-blue-200 shadow-sm'} transition-colors`}>
                                <div className="flex gap-4">
                                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${isPast ? 'bg-gray-200 text-gray-500' : 'bg-blue-50 text-[var(--color-myPrimary)]'}`}>
                                        <span className="text-xs font-bold uppercase">{format(mDate, 'MMM')}</span>
                                        <span className="text-xl font-black">{format(mDate, 'dd')}</span>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isPast ? 'text-gray-700' : 'text-gray-900'} mb-1`}>{meeting.title}</h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {format(mDate, 'h:mm a')}</span>
                                        </div>
                                        {meeting.description && <p className="text-sm text-gray-600 mt-2 line-clamp-1">{meeting.description}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {meeting.meeting_link && !isPast && (
                                        <a
                                            href={meeting.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-blue-50 text-[var(--color-myPrimary)] text-sm font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2"
                                        >
                                            <Video className="w-4 h-4" /> Join
                                        </a>
                                    )}
                                    {canManage && (
                                        <button
                                            onClick={() => {
                                                if (confirm("Cancel this meeting?")) deleteMutation.mutate(meeting.id);
                                            }}
                                            className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <CreateMeetingModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teamId={teamId}
                onCreated={() => queryClient.invalidateQueries({ queryKey: ["team-meetings", teamId] })}
            />
        </div>
    );
}

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { createClubEvent } from '../services/clubEvents.service';

export default function CreateClubEventForm({ clubId }: { clubId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    image_url: '',
    location: '',
    start_at: '',
    end_at: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      createClubEvent({
        club_id: clubId,
        title: form.title,
        description: form.description || undefined,
        image_url: form.image_url || undefined,
        location: form.location || undefined,
        start_at: form.start_at,
        end_at: form.end_at || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-events'] });
      queryClient.invalidateQueries({ queryKey: ['club-events-public'] });
      setForm({ title: '', description: '', image_url: '', location: '', start_at: '', end_at: '' });
      toast.success('Event created');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_at) {
      toast.error('Title and start date are required');
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Event title *"
        required
        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 outline-none"
      />
      <input
        type="datetime-local"
        value={form.start_at}
        onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))}
        required
        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 outline-none"
      />
      <input
        type="text"
        value={form.image_url}
        onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
        placeholder="Image URL"
        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 outline-none"
      />
      <input
        type="text"
        value={form.location}
        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        placeholder="Location"
        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 outline-none"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Description"
        rows={2}
        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 outline-none"
      />
      <button
        type="submit"
        disabled={mutation.isPending || !form.title.trim() || !form.start_at}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-myPrimary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
      >
        <CalendarPlus className="w-4 h-4" /> Create Event
      </button>
    </form>
  );
}

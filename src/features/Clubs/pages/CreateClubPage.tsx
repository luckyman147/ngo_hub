import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../../../Global_Components/navBar';
import { createClub } from '../services/clubs.service';

const schema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters'),
  description: z.string().optional(),
  region: z.string().optional(),
});

export default function CreateClubPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', region: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => createClub({ name: form.name, description: form.description || undefined, region: form.region || undefined }),
    onSuccess: (club) => {
      toast.success('Club created! You are the president.');
      navigate(`/clubs/${club.id}`);
    },
    onError: (err: Error) => {
      setErrors({ general: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        const k = i.path[0];
        if (typeof k === 'string') fieldErrors[k] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6 pb-24 md:pb-0">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Create a Club</h1>
            <p className="text-gray-500 text-sm mb-6">
              You will become the president and can approve members and assign roles.
            </p>

            {errors.general && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Club Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Youth Leadership Club"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 focus:border-[var(--color-myPrimary)] outline-none"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What is your club about?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 focus:border-[var(--color-myPrimary)] outline-none resize-none"
                />
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  Region (optional)
                </label>
                <input
                  id="region"
                  type="text"
                  value={form.region}
                  onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                  placeholder="e.g. New York, USA"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 focus:border-[var(--color-myPrimary)] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full py-3 rounded-xl bg-[var(--color-myPrimary)] text-white font-semibold hover:opacity-90 disabled:opacity-60 transition"
              >
                {mutation.isPending ? 'Creating…' : 'Create Club'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

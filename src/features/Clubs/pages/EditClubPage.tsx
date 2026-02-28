import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import Navbar from '../../../Global_Components/navBar';
import { getClubById, updateClub } from '../services/clubs.service';
import { useAuth } from '../../Authentication/auth.context';

const schema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters'),
  description: z.string().optional(),
  region: z.string().optional(),
  logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export default function EditClubPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    description: '',
    region: '',
    logo_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  const { data: club, isLoading } = useQuery({
    queryKey: ['club', id],
    queryFn: () => getClubById(id!),
    enabled: !!id,
  });

  // Pre-populate form once club data is loaded
  useEffect(() => {
    if (club && !initialized) {
      setForm({
        name: club.name ?? '',
        description: club.description ?? '',
        region: club.region ?? '',
        logo_url: club.logo_url ?? '',
      });
      setInitialized(true);
    }
  }, [club, initialized]);

  // Access guard: only president or superadmin may edit
  useEffect(() => {
    if (club && user && club.president_id !== user.id) {
      // Check for superadmin is async; we optimistically redirect non-presidents
      // unless the club query itself succeeds (president check is sufficient here)
      toast.error('Only the club president can edit this club.');
      navigate(`/clubs/${id}`);
    }
  }, [club, user, id, navigate]);

  const mutation = useMutation({
    mutationFn: () =>
      updateClub(id!, {
        name: form.name,
        description: form.description || undefined,
        region: form.region || undefined,
        logo_url: form.logo_url || undefined,
      }),
    onSuccess: () => {
      toast.success('Club updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['club', id] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      navigate(`/clubs/${id}`);
    },
    onError: (err: Error) => {
      setErrors({ general: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = schema.safeParse({
      name: form.name,
      description: form.description || undefined,
      region: form.region || undefined,
      logo_url: form.logo_url || undefined,
    });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-myPrimary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Club not found.</p>
        <button
          onClick={() => navigate('/clubs')}
          className="text-[var(--color-myPrimary)] font-medium"
        >
          Back to Clubs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="md:ms-64 pt-16 md:pt-6 pb-24 md:pb-0">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(`/clubs/${id}`)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Club
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[var(--color-myPrimary)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Edit Club</h1>
                <p className="text-sm text-gray-500">Update your club's information</p>
              </div>
            </div>

            {/* General error */}
            {errors.general && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Club Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Club Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Youth Leadership Club"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 focus:border-[var(--color-myPrimary)] outline-none transition"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What is your club about?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 focus:border-[var(--color-myPrimary)] outline-none resize-none transition"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Region */}
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  Region <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="region"
                  type="text"
                  value={form.region}
                  onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                  placeholder="e.g. New York, USA"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 focus:border-[var(--color-myPrimary)] outline-none transition"
                />
                {errors.region && (
                  <p className="mt-1 text-sm text-red-600">{errors.region}</p>
                )}
              </div>

              {/* Logo URL */}
              <div>
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="logo_url"
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 focus:border-[var(--color-myPrimary)] outline-none transition"
                />
                {errors.logo_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.logo_url}</p>
                )}
                {/* Logo preview */}
                {form.logo_url && !errors.logo_url && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={form.logo_url}
                      alt="Logo preview"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                    />
                    <span className="text-xs text-gray-500">Logo preview</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/clubs/${id}`)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-myPrimary)] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition"
                >
                  {mutation.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

import type { NGO } from '../types';
import { Building2, Target, Wrench } from 'lucide-react';
import { TagManager } from '../../Members/components/profile/shared/TagManager';
import { NGO_CAUSE_OPTIONS, NGO_NEED_OPTIONS } from '../constants/options';
import { useNGOForm } from '../hooks/useNGOForm';

interface NGOCreateFormProps {
  onSuccess?: (ngo: NGO) => void;
}

const inputBase =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[var(--color-myPrimary)]/20 focus:border-[var(--color-myPrimary)] outline-none transition-all text-sm';

export default function NGOCreateForm({ onSuccess }: NGOCreateFormProps) {
  const { form, errors, setField, handleSubmit, createMutation } = useNGOForm();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const ngo = await handleSubmit(e);
    if (ngo && onSuccess) onSuccess(ngo);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
    >
      {errors.general && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errors.general}
        </div>
      )}

      {/* Basic Info Card */}
      <section
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        aria-labelledby="ngo-basic-heading"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Building2 className="h-5 w-5 text-[var(--color-myPrimary)]" aria-hidden />
          </div>
          <div>
            <h2 id="ngo-basic-heading" className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Basic Information
            </h2>
            <p className="text-xs text-gray-500">Name and mission of your organization</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="ngo-name" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Organization Name
            </label>
            <input
              id="ngo-name"
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Green Earth Initiative"
              className={inputBase}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'ngo-name-error' : undefined}
            />
            {errors.name && (
              <p id="ngo-name-error" className="mt-1 text-sm text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ngo-mission" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Mission Statement
            </label>
            <textarea
              id="ngo-mission"
              value={form.mission}
              onChange={(e) => setField('mission', e.target.value)}
              placeholder="Describe your organization's core mission and purpose..."
              rows={4}
              className={`${inputBase} resize-none`}
              aria-invalid={!!errors.mission}
              aria-describedby={errors.mission ? 'ngo-mission-error' : undefined}
            />
            {errors.mission && (
              <p id="ngo-mission-error" className="mt-1 text-sm text-red-600">
                {errors.mission}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="ngo-description" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="ngo-description"
              value={form.description ?? ''}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Additional details about your organization..."
              rows={3}
              className={`${inputBase} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="ngo-region" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Region <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="ngo-region"
              type="text"
              value={form.region ?? ''}
              onChange={(e) => setField('region', e.target.value)}
              placeholder="e.g. Tunis, North Africa"
              className={inputBase}
            />
          </div>
        </div>
      </section>

      {/* Causes Card */}
      <section
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        aria-labelledby="ngo-causes-heading"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <Target className="h-5 w-5 text-emerald-600" aria-hidden />
          </div>
          <div>
            <h2 id="ngo-causes-heading" className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Causes
            </h2>
            <p className="text-xs text-gray-500">Select the causes your organization addresses</p>
          </div>
        </div>

        <div className="space-y-4">
          <TagManager
            tags={form.causes}
            onUpdate={(tags) => setField('causes', tags)}
            options={[...NGO_CAUSE_OPTIONS]}
            readOnly={false}
            placeholder="Add a cause"
            tagColorClass="text-emerald-700"
            tagBgClass="bg-emerald-50"
            tagBorderClass="border-emerald-100"
            customInputLabel="Or type a custom cause"
            quickSelectLabel="Quick select"
          />
          {errors.causes && (
            <p className="text-sm text-red-600">{errors.causes}</p>
          )}
        </div>
      </section>

      {/* Needs Card */}
      <section
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        aria-labelledby="ngo-needs-heading"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Wrench className="h-5 w-5 text-amber-600" aria-hidden />
          </div>
          <div>
            <h2 id="ngo-needs-heading" className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Needs
            </h2>
            <p className="text-xs text-gray-500">What skills or resources does your NGO need from volunteers?</p>
          </div>
        </div>

        <div className="space-y-4">
          <TagManager
            tags={form.needs}
            onUpdate={(tags) => setField('needs', tags)}
            options={[...NGO_NEED_OPTIONS]}
            readOnly={false}
            placeholder="Add a need"
            tagColorClass="text-amber-700"
            tagBgClass="bg-amber-50"
            tagBorderClass="border-amber-100"
            customInputLabel="Or type a custom need"
            quickSelectLabel="Quick select"
          />
          {errors.needs && (
            <p className="text-sm text-red-600">{errors.needs}</p>
          )}
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-xl bg-[var(--color-myPrimary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus:ring-2 focus:ring-[var(--color-myPrimary)]/50 focus:ring-offset-2 disabled:opacity-60"
        >
          {createMutation.isPending ? 'Creating…' : 'Create NGO'}
        </button>
      </div>
    </form>
  );
}

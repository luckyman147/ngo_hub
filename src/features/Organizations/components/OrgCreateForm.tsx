import { useState } from 'react';
import { useOrgCreate } from '../hooks/useOrgCreate';
import type { Organization, OrganizationType } from '../../../types/organization';

interface Props {
  type: OrganizationType;
  onSuccess: (org: Organization) => void;
}

export default function OrgCreateForm({ type, onSuccess }: Props) {
  const { mutation, errors, validate } = useOrgCreate();
  const [form, setForm] = useState({ name: '', mission: '', description: '', region: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form.name)) return;

    mutation.mutate({
      ...form,
      type,
      metadata: type === 'ngo' ? { causes: [], needs: [] } : {}
    }, {
      onSuccess
    });
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mutation.isError && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
          {(mutation.error as Error).message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          className={inputClass}
          placeholder={`Enter ${type.toUpperCase()} name`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mission</label>
        <textarea
          value={form.mission}
          onChange={(e) => setForm(f => ({ ...f, mission: e.target.value }))}
          className={inputClass}
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {mutation.isPending ? 'Creating...' : `Create ${type === 'club' ? 'Club' : 'NGO'}`}
      </button>
    </form>
  );
}

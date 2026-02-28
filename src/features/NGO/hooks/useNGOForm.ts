import { useState } from 'react';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNGO } from '../services/ngo.service';
import type { NGOCreateInput } from '../types';

const ngoFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mission: z.string().min(10, 'Mission must be at least 10 characters'),
  description: z.string().optional(),
  causes: z.array(z.string()).min(1, 'Select at least one cause'),
  needs: z.array(z.string()).min(1, 'Select at least one need'),
  region: z.string().optional(),
});

export type NGOFormState = z.infer<typeof ngoFormSchema>;

export function useNGOForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NGOFormState>({
    name: '',
    mission: '',
    description: '',
    causes: [],
    needs: [],
    region: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (input: NGOCreateInput) => createNGO(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngos'] });
    },
  });

  const setField = <K extends keyof NGOFormState>(key: K, value: NGOFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const toggleCause = (cause: string) => {
    setForm((prev) => ({
      ...prev,
      causes: prev.causes.includes(cause)
        ? prev.causes.filter((c) => c !== cause)
        : [...prev.causes, cause],
    }));
    if (errors.causes) setErrors((prev) => ({ ...prev, causes: '' }));
  };

  const toggleNeed = (need: string) => {
    setForm((prev) => ({
      ...prev,
      needs: prev.needs.includes(need)
        ? prev.needs.filter((n) => n !== need)
        : [...prev.needs, need],
    }));
    if (errors.needs) setErrors((prev) => ({ ...prev, needs: '' }));
  };

  const submit = async () => {
    const result = ngoFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === 'string') fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return null;
    }
    setErrors({});
    try {
      const ngo = await createMutation.mutateAsync(result.data);
      return ngo;
    } catch (err) {
      setErrors({ general: (err as Error).message });
      return null;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    return submit();
  };

  return { form, errors, setField, toggleCause, toggleNeed, handleSubmit, createMutation };
}

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createOrganization } from '../services/organization.service';
import type { OrganizationType } from '../../../types/organization';

export function useOrgCreate() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const mutation = useMutation({
    mutationFn: (variables: { 
      name: string; 
      type: OrganizationType; 
      mission?: string;
      description?: string;
      region?: string;
      metadata?: Record<string, any>;
    }) => createOrganization(variables),
  });

  const validate = (name: string) => {
    const newErrors: Record<string, string> = {};
    if (!name || name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    mutation,
    errors,
    setErrors,
    validate
  };
}

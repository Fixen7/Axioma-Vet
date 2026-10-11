import { supabase } from './supabase';

export interface CommercialExperienceContext {
  application: string;
  access: {
    allowed: boolean;
    source: 'trial' | 'subscription' | 'manual' | 'none';
    expiresAt: string | null;
    daysRemaining: number | null;
  };
  commercial: {
    phase: 
      | 'trial_active' 
      | 'trial_expiring' 
      | 'trial_expired' 
      | 'subscription_active' 
      | 'subscription_canceling' 
      | 'subscription_past_due' 
      | 'subscription_unpaid' 
      | 'subscription_expired' 
      | 'subscription_canceled' 
      | 'no_access';
    headline: string | null;
    message: string | null;
    cta: {
      action: 'OPEN_STORE' | 'MANAGE_SUBSCRIPTION' | 'NONE';
      label: string;
    } | null;
  };
}

export type ModuleAccessStatus = CommercialExperienceContext;

export async function getModuleAccessStatus(workspaceId: string, moduleId: string): Promise<CommercialExperienceContext> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No valid authentication session found for CoreAccessClient');
  }

  const coreUrl = import.meta.env.VITE_CORE_URL;
  
    const response = await fetch(`${coreUrl}/api/internal/access/${moduleId}?workspaceId=${workspaceId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`CoreAccessClient Error: ${response.status} - ${errorBody}`);
      throw new Error(`Failed to fetch access status: ${response.status}`);
    }

    return await response.json();
}

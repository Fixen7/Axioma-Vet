import { supabase } from './supabase';

export interface ModuleAccessStatus {
  module: string;
  access: boolean;
  status: 'trial' | 'active' | 'expired' | 'none' | 'error';
  source: 'trial' | 'subscription_item' | 'manual' | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  error?: boolean;
}

export async function getModuleAccessStatus(workspaceId: string, moduleId: string): Promise<ModuleAccessStatus> {
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

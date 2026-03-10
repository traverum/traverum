import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useSuperadmin() {
  const { user } = useAuth();

  const { data: isSuperadmin = false, isLoading } = useQuery({
    queryKey: ['superadmin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data } = await supabase
        .from('users')
        .select('is_superadmin')
        .eq('auth_id', user.id)
        .single() as { data: { is_superadmin: boolean } | null };

      return data?.is_superadmin === true;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return { isSuperadmin, isLoading };
}

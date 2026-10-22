'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RoleThemeProvider } from '@/lib/role-theme';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <RoleThemeProvider>
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster position="top-right" richColors />
          {children}
        </QueryClientProvider>
      </TooltipProvider>
    </RoleThemeProvider>
  );
}
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ErrorBoundary } from '@/shared/ui';
import type { AppStore } from '@/store/store';

export function AppProviders({ store, children }: { store: AppStore; children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Provider store={store}>{children}</Provider>
    </ErrorBoundary>
  );
}

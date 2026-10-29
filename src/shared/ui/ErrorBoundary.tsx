import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/shared/lib/logger';
import { ErrorState } from './ErrorState';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Last-resort boundary around the whole app. Route-level render errors are handled by the router. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Unhandled render error', { error, componentStack: info.componentStack });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="p-6">
          <ErrorState
            headingLevel="h1"
            title="Something went wrong"
            message="An unexpected error stopped the page from loading. Reloading usually fixes it."
            retryLabel="Reload page"
            onRetry={() => {
              window.location.reload();
            }}
          />
        </main>
      );
    }
    return this.props.children;
  }
}

import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { logger } from '@/shared/lib/logger';
import { ErrorState } from '@/shared/ui';
import { APP_NAME } from '../appName';

/** Route-level error element: details go to the logger, users get a generic message. */
export function RouteErrorPage() {
  const error = useRouteError();
  useEffect(() => {
    logger.error('Route error', error);
  }, [error]);

  return (
    <>
      <title>{`Something went wrong · ${APP_NAME}`}</title>
      <ErrorState
        headingLevel="h1"
        title="Something went wrong"
        message="This page hit an unexpected problem. Reloading usually fixes it."
        retryLabel="Reload page"
        onRetry={() => {
          window.location.reload();
        }}
      />
    </>
  );
}

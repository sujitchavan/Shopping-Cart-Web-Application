import { Link } from 'react-router';
import { buttonClassName, PageHeading } from '@/shared/ui';
import { APP_NAME } from '../appName';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-4">
      <title>{`Page not found · ${APP_NAME}`}</title>
      <PageHeading>Page not found</PageHeading>
      <p className="text-ink-muted">
        The page you were looking for doesn&apos;t exist or has moved.
      </p>
      <Link to="/" className={buttonClassName()}>
        Back to products
      </Link>
    </div>
  );
}

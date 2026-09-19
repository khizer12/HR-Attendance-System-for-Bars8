import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';

export default function Unauthorized() {
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="font-heading text-5xl text-warning">403</div>
        <h2 className="font-heading text-2xl">Access denied</h2>
        <p className="text-muted-gray text-sm">
          You don&apos;t have permission to view this page.
        </p>
        <Link to="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="font-heading text-6xl text-lime">404</div>
        <h2 className="font-heading text-2xl">Page not found</h2>
        <p className="text-muted-gray text-sm">
          The page you are looking for does not exist.
        </p>
        <Link to="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
import { OfficeLocationsList } from '@/features/settings';

export default function Settings() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h2 className="font-heading text-2xl">Settings</h2>
        <p className="text-muted-gray text-sm mt-1">
          Configure company-wide attendance rules.
        </p>
      </div>

      <OfficeLocationsList />

      <div className="rounded-lg border border-charcoal-3 bg-charcoal/40 p-5">
        <p className="text-xs text-muted-gray">
          Attendance defaults, company profile, and system timezone arrive in a
          later phase.
        </p>
      </div>
    </div>
  );
}
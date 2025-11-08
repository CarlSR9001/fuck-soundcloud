/**
 * Health Check Page
 *
 * System status page for M0 Bootstrap.
 * Displays basic system information and readiness.
 */

import { Container } from '@/components';
import { branding } from '@/config';

export const metadata = {
  title: 'Health Check',
};

export default function HealthPage() {
  // In M0, this is a static page. Future versions will check:
  // - Database connectivity
  // - Redis availability
  // - MinIO/S3 storage
  // - Worker queue status

  const checks = [
    { name: 'Web Application', status: 'operational', message: 'Next.js server running' },
    { name: 'Configuration', status: 'operational', message: 'Branding system loaded' },
    { name: 'API', status: 'pending', message: 'Not yet implemented (M1)' },
    { name: 'Database', status: 'pending', message: 'Not yet implemented (M1)' },
    { name: 'Storage', status: 'pending', message: 'Not yet implemented (M1)' },
  ];

  return (
    <div className="py-3xl">
      <Container size="lg">
        <div className="flex flex-col gap-2xl">
          {/* Header */}
          <div className="flex flex-col gap-md">
            <h1 className="text-4xl font-bold text-neutral-900">
              Health Check
            </h1>
            <p className="text-base text-neutral-600">
              System status for {branding.name}
            </p>
          </div>

          {/* Status Overview */}
          <div className="card p-xl">
            <div className="flex items-center gap-md mb-xl">
              <StatusIndicator status="operational" />
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  M0 Bootstrap: Operational
                </h2>
                <p className="text-sm text-neutral-600">
                  Web application skeleton is running
                </p>
              </div>
            </div>

            {/* Individual Checks */}
            <div className="flex flex-col gap-md border-t border-border pt-lg">
              {checks.map((check) => (
                <CheckItem key={check.name} {...check} />
              ))}
            </div>
          </div>

          {/* System Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <InfoCard
              label="Milestone"
              value="M0 Bootstrap"
            />
            <InfoCard
              label="Framework"
              value="Next.js 15 (App Router)"
            />
            <InfoCard
              label="Branding System"
              value="Modular Configuration"
            />
            <InfoCard
              label="Aesthetic"
              value="Year 3035 Timeless"
            />
          </div>
        </div>
      </Container>
    </div>
  );
}

interface CheckItemProps {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'pending';
  message: string;
}

function CheckItem({ name, status, message }: CheckItemProps) {
  return (
    <div className="flex items-start gap-md">
      <StatusIndicator status={status} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-md">
          <h3 className="text-sm font-medium text-neutral-900">{name}</h3>
          <span className="text-xs text-neutral-500 capitalize">{status}</span>
        </div>
        <p className="text-xs text-neutral-600 mt-xs">{message}</p>
      </div>
    </div>
  );
}

interface StatusIndicatorProps {
  status: 'operational' | 'degraded' | 'down' | 'pending';
  size?: 'sm' | 'md';
}

function StatusIndicator({ status, size = 'md' }: StatusIndicatorProps) {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  const colorClass = {
    operational: 'bg-success',
    degraded: 'bg-warning',
    down: 'bg-error',
    pending: 'bg-neutral-400',
  }[status];

  return (
    <div className={`${sizeClass} ${colorClass} rounded-full flex-shrink-0`} />
  );
}

interface InfoCardProps {
  label: string;
  value: string;
}

function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="card p-lg">
      <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-xs">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-neutral-900">
        {value}
      </dd>
    </div>
  );
}

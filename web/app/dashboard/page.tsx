/**
 * Impact Dashboard Page
 *
 * Shows user's contribution history, artists supported, and impact statistics.
 * Protected route - requires authentication.
 * Year 3035 aesthetic.
 */

import { Metadata } from 'next';
import { branding } from '@/config';
import { Container } from '@/components';
import { DashboardClient } from './DashboardClient';

export const metadata: Metadata = {
  title: `Dashboard – ${branding.name}`,
  description: 'View your contribution history and impact statistics.',
};

export default async function DashboardPage() {
  return (
    <Container size="xl">
      <div className="py-xl">
        <DashboardClient />
      </div>
    </Container>
  );
}

/**
 * Moderation Dashboard Page
 *
 * Admin-only interface for content moderation, reports, strikes, and DMCA processing.
 * Year 3035 aesthetic.
 */

import { Metadata } from 'next';
import { branding } from '@/config';
import { Container } from '@/components';
import { ModerationClient } from './ModerationClient';

export const metadata: Metadata = {
  title: `Moderation Dashboard – ${branding.name}`,
  description: 'Admin interface for content moderation and DMCA processing.',
};

export default async function ModerationPage() {
  return (
    <Container size="full">
      <div className="py-xl">
        <ModerationClient />
      </div>
    </Container>
  );
}

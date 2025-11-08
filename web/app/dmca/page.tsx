/**
 * DMCA Policy Page
 *
 * DMCA compliance policy and takedown request form.
 */

import { Metadata } from 'next';
import { branding } from '@/config';
import { Container } from '@/components';
import { DMCAFormClient } from './DMCAFormClient';

export const metadata: Metadata = {
  title: `DMCA Policy – ${branding.name}`,
  description: 'DMCA copyright policy and takedown notice procedures.',
};

export default function DMCAPage() {
  return (
    <Container size="md">
      <div className="py-xl space-y-xl">
        <div className="prose prose-neutral max-w-none">
          <h1>DMCA Copyright Policy</h1>
          <p className="lead">
            {branding.name} respects the intellectual property rights of others and expects our users to do the same.
          </p>

          <h2>Copyright Infringement Notification</h2>
          <p>
            If you believe that content on {branding.name} infringes your copyright, you may submit a takedown notice
            in accordance with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512(c).
          </p>

          <h2>Required Information</h2>
          <p>To file a valid DMCA takedown notice, you must provide the following information:</p>
          <ol>
            <li>A physical or electronic signature of the copyright owner or authorized agent</li>
            <li>Identification of the copyrighted work claimed to have been infringed</li>
            <li>Identification of the material that is claimed to be infringing, with sufficient detail to locate it on the platform</li>
            <li>Your contact information (address, telephone number, and email address)</li>
            <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner</li>
            <li>
              A statement, under penalty of perjury, that the information in the notification is accurate and that you are
              authorized to act on behalf of the copyright owner
            </li>
          </ol>

          <h2>Counter-Notification</h2>
          <p>
            If you believe your content was removed in error or misidentification, you may file a counter-notification containing:
          </p>
          <ol>
            <li>Your physical or electronic signature</li>
            <li>Identification of the material that was removed and its location before removal</li>
            <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake</li>
            <li>Your name, address, telephone number, and consent to jurisdiction</li>
          </ol>

          <h2>Repeat Infringer Policy</h2>
          <p>
            We will terminate the accounts of users who are repeat infringers. A user is considered a repeat infringer
            if they have received multiple valid DMCA takedown notices.
          </p>

          <h2>Processing Timeline</h2>
          <ul>
            <li>Takedown notices are reviewed within 24-48 hours</li>
            <li>Valid claims result in immediate content removal</li>
            <li>Counter-notifications are forwarded to the original claimant</li>
            <li>Content may be restored 10-14 business days after counter-notification if no legal action is taken</li>
          </ul>

          <h2>Contact Information</h2>
          <p>
            DMCA Agent:<br />
            {branding.name}<br />
            Email: <a href={`mailto:${branding.contact.support}`}>{branding.contact.support}</a>
          </p>
        </div>

        {/* DMCA Takedown Form */}
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-lg p-xl">
          <h2 className="text-2xl font-bold text-neutral-900 mb-lg">Submit DMCA Takedown Notice</h2>
          <DMCAFormClient />
        </div>
      </div>
    </Container>
  );
}

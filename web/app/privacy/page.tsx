/**
 * Privacy Policy Page
 *
 * Comprehensive privacy policy explaining data collection and usage.
 */

import { Metadata } from 'next';
import { branding } from '@/config';
import { Container } from '@/components';

export const metadata: Metadata = {
  title: `Privacy Policy – ${branding.name}`,
  description: 'Privacy policy and data protection practices.',
};

export default function PrivacyPage() {
  return (
    <Container size="md">
      <div className="py-xl prose prose-neutral max-w-none">
        <h1>Privacy Policy</h1>
        <p className="lead">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <h2>1. Introduction</h2>
        <p>
          {branding.name} ("we", "us", or "our") respects your privacy and is committed to protecting your personal data.
          This privacy policy explains how we collect, use, and safeguard your information when you use our platform.
        </p>

        <h2>2. Information We Collect</h2>

        <h3>2.1 Information You Provide</h3>
        <ul>
          <li><strong>Account Information:</strong> Username, email address, password (encrypted), display name, bio</li>
          <li><strong>Profile Information:</strong> Avatar, profile pictures, banner images</li>
          <li><strong>Content:</strong> Audio files, artwork, track metadata, descriptions, comments</li>
          <li><strong>Payment Information:</strong> Processed securely through our payment provider (we do not store card details)</li>
        </ul>

        <h3>2.2 Automatically Collected Information</h3>
        <ul>
          <li><strong>Usage Data:</strong> Play counts, listening history, track interactions, playlist activity</li>
          <li><strong>Technical Data:</strong> IP address (hashed for privacy), browser type, device information, operating system</li>
          <li><strong>Analytics Data:</strong> Aggregate statistics, referral sources, user behavior patterns</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and maintain our platform services</li>
          <li>Process your contributions and payments</li>
          <li>Personalize your experience and provide recommendations</li>
          <li>Communicate with you about your account and platform updates</li>
          <li>Analyze platform usage and improve our services</li>
          <li>Prevent fraud, spam, and abuse</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>4. Data Sharing and Disclosure</h2>
        <p>We do not sell your personal information. We may share your data with:</p>
        <ul>
          <li><strong>Service Providers:</strong> Payment processors, hosting services, analytics providers (minimal data, contractually bound)</li>
          <li><strong>Public Information:</strong> Your profile, public tracks, and comments are visible to other users</li>
          <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights</li>
          <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
        </ul>

        <h2>5. Privacy-Respecting Analytics</h2>
        <p>
          We use privacy-respecting analytics that:
        </p>
        <ul>
          <li>Hash IP addresses using SHA-256 before storage</li>
          <li>Do not use third-party tracking pixels or cookies</li>
          <li>Aggregate data for statistics without identifying individuals</li>
          <li>Retain play records for 30 days, then archive as anonymized daily summaries</li>
        </ul>

        <h2>6. Data Retention</h2>
        <ul>
          <li><strong>Account Data:</strong> Retained while your account is active, deleted within 90 days of account deletion</li>
          <li><strong>Content:</strong> Deleted immediately when you remove it (backups retained for 30 days)</li>
          <li><strong>Play Analytics:</strong> Raw data deleted after 30 days, aggregated statistics retained indefinitely</li>
          <li><strong>Payment Records:</strong> Retained for 7 years for tax and legal compliance</li>
        </ul>

        <h2>7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Correction:</strong> Update or correct inaccurate information</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
          <li><strong>Export:</strong> Download your content and data in portable formats</li>
          <li><strong>Objection:</strong> Object to certain data processing activities</li>
          <li><strong>Withdraw Consent:</strong> Revoke consent for optional data collection</li>
        </ul>

        <h2>8. Security</h2>
        <p>We implement industry-standard security measures:</p>
        <ul>
          <li>HTTPS/TLS encryption for all data in transit</li>
          <li>Encrypted password storage using bcrypt</li>
          <li>Secure authentication with JWT tokens and session management</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>Limited access to personal data (need-to-know basis)</li>
          <li>Automated backups with encryption at rest</li>
        </ul>

        <h2>9. Cookies and Tracking</h2>
        <p>We use minimal cookies for:</p>
        <ul>
          <li><strong>Authentication:</strong> Secure session management (httpOnly, SameSite cookies)</li>
          <li><strong>Preferences:</strong> Remember your settings (volume, playback speed)</li>
        </ul>
        <p>
          We do NOT use third-party advertising cookies or cross-site tracking. You can disable cookies in your browser,
          but some features may not function properly.
        </p>

        <h2>10. Children's Privacy</h2>
        <p>
          Our platform is not directed to children under 13. We do not knowingly collect personal information from children.
          If we become aware that a child under 13 has provided personal information, we will delete it immediately.
        </p>

        <h2>11. International Data Transfers</h2>
        <p>
          Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards
          are in place to protect your data in accordance with this privacy policy.
        </p>

        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. We will notify you of material changes via email or through
          the platform. Your continued use after changes constitutes acceptance of the updated policy.
        </p>

        <h2>13. Contact Us</h2>
        <p>
          If you have questions about this privacy policy or wish to exercise your rights, contact us at:
        </p>
        <p>
          Email: <a href={`mailto:${branding.contact.support}`}>{branding.contact.support}</a>
        </p>

        <h2>14. Data Protection Officer</h2>
        <p>
          For GDPR-related inquiries, you may contact our Data Protection Officer at:{' '}
          <a href={`mailto:${branding.contact.support}`}>{branding.contact.support}</a>
        </p>

        <h2>15. Your California Privacy Rights</h2>
        <p>
          California residents have additional rights under the California Consumer Privacy Act (CCPA), including the right
          to know what personal information is collected, the right to delete personal information, and the right to opt-out
          of the sale of personal information (note: we do not sell personal information).
        </p>
      </div>
    </Container>
  );
}

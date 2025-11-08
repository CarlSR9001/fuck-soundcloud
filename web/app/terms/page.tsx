/**
 * Terms of Service Page
 *
 * Comprehensive legal terms for platform usage.
 */

import { Metadata } from 'next';
import { branding } from '@/config';
import { Container } from '@/components';

export const metadata: Metadata = {
  title: `Terms of Service – ${branding.name}`,
  description: 'Terms of Service and usage policies.',
};

export default function TermsPage() {
  return (
    <Container size="md">
      <div className="py-xl prose prose-neutral max-w-none">
        <h1>Terms of Service</h1>
        <p className="lead">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using {branding.name}, you agree to be bound by these Terms of Service and all applicable laws and regulations.
          If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
        </p>

        <h2>2. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          You must immediately notify us of any unauthorized use of your account or any other breach of security.
        </p>
        <ul>
          <li>You must be at least 13 years old to create an account</li>
          <li>You must provide accurate and complete information</li>
          <li>You may not use another person's account without permission</li>
          <li>You may not transfer your account to another person</li>
        </ul>

        <h2>3. Content Ownership and Rights</h2>
        <p>
          You retain all ownership rights to content you upload to {branding.name}. By uploading content, you grant us a worldwide,
          non-exclusive, royalty-free license to host, store, reproduce, and distribute your content for the purpose of operating the platform.
        </p>

        <h2>4. Upload Attestation</h2>
        <p>
          By uploading content, you attest under penalty of perjury that:
        </p>
        <ul>
          <li>You own all rights to the uploaded content, or have explicit permission from the rights holder</li>
          <li>The content does not infringe on any third-party copyrights, trademarks, or other intellectual property rights</li>
          <li>The content does not violate any applicable laws or regulations</li>
        </ul>

        <h2>5. Prohibited Content</h2>
        <p>You may not upload, share, or distribute content that:</p>
        <ul>
          <li>Infringes on intellectual property rights</li>
          <li>Contains malware, viruses, or malicious code</li>
          <li>Is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
          <li>Contains personal information of others without consent</li>
          <li>Impersonates any person or entity</li>
        </ul>

        <h2>6. Content Moderation</h2>
        <p>
          We reserve the right to remove any content that violates these Terms or is otherwise objectionable, at our sole discretion.
          We may issue warnings, strikes, or ban accounts for violations. Decisions are final but may be appealed.
        </p>

        <h2>7. DMCA Compliance</h2>
        <p>
          We respect intellectual property rights and comply with the Digital Millennium Copyright Act (DMCA).
          If you believe content on our platform infringes your copyright, please see our <a href="/dmca">DMCA Policy</a> for
          instructions on filing a takedown notice.
        </p>

        <h2>8. Contributions and Payments</h2>
        <p>
          All contributions are processed through secure payment providers. Contributions are non-refundable except as required by law.
          Monthly contributions can be canceled at any time and will remain active until the end of the current billing period.
        </p>

        <h2>9. Privacy and Data</h2>
        <p>
          Your use of {branding.name} is subject to our <a href="/privacy">Privacy Policy</a>, which describes how we collect,
          use, and protect your personal information.
        </p>

        <h2>10. Termination</h2>
        <p>
          We may terminate or suspend your account and access to the platform immediately, without prior notice or liability,
          for any reason, including breach of these Terms. Upon termination, your right to use the platform will cease immediately.
        </p>

        <h2>11. Disclaimer of Warranties</h2>
        <p>
          The platform is provided "as is" and "as available" without warranties of any kind, either express or implied.
          We do not warrant that the platform will be uninterrupted, timely, secure, or error-free.
        </p>

        <h2>12. Limitation of Liability</h2>
        <p>
          In no event shall {branding.name}, its directors, employees, or agents be liable for any indirect, incidental,
          special, consequential, or punitive damages arising out of or relating to your use of the platform.
        </p>

        <h2>13. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless {branding.name} from any claims, losses, damages, liabilities, and expenses
          arising out of your use of the platform, your violation of these Terms, or your violation of any rights of another.
        </p>

        <h2>14. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or
          through the platform. Your continued use of the platform after changes constitutes acceptance of the new Terms.
        </p>

        <h2>15. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the platform
          operator is located, without regard to its conflict of law provisions.
        </p>

        <h2>16. Contact</h2>
        <p>
          If you have any questions about these Terms, please contact us at{' '}
          <a href={`mailto:${branding.contact.support}`}>{branding.contact.support}</a>.
        </p>
      </div>
    </Container>
  );
}

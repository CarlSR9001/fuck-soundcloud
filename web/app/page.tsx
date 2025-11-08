/**
 * Home Page
 *
 * Landing page with year 3035 aesthetic.
 * Timeless simplicity, calm confidence.
 */

import { Container } from '@/components';
import { branding } from '@/config';

export default function HomePage() {
  return (
    <div className="py-5xl">
      {/* Hero Section */}
      <Container size="lg">
        <div className="flex flex-col items-center text-center gap-xl animate-fade-in">
          <h1 className="text-6xl font-bold text-neutral-900 text-balance">
            {branding.name}
          </h1>

          <p className="text-xl text-neutral-600 max-w-md text-balance">
            {branding.tagline}
          </p>

          <p className="text-base text-neutral-500 max-w-lg leading-relaxed">
            {branding.description}
          </p>

          {/* CTA Section */}
          <div className="flex gap-md mt-lg">
            <button className="btn-primary">
              Get Started
            </button>
            <button className="btn-secondary">
              Learn More
            </button>
          </div>
        </div>
      </Container>

      {/* Feature Highlights */}
      <Container className="mt-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2xl">
          <FeatureCard
            title="Artist-First"
            description="Liner notes, stems, credits, and versions are first-class features, not afterthoughts."
          />
          <FeatureCard
            title="Own Your Media"
            description="Your files live on your infrastructure. No mystery CDNs, no third-party hosting."
          />
          <FeatureCard
            title="No Pretense"
            description="Real functionality, real streaming, real control. Performance over polish."
          />
        </div>
      </Container>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="card p-xl flex flex-col gap-md">
      <h3 className="text-lg font-semibold text-neutral-900">
        {title}
      </h3>
      <p className="text-sm text-neutral-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

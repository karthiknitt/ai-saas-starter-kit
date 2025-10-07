import dynamic from 'next/dynamic';
import { HeroHeader } from '@/components/header';
import HeroSection from '@/components/hero-section';

// Lazy load heavy components that don't need to be immediately visible
const Features = dynamic(() => import('@/components/features-4'), {
  loading: () => <div className="bg-muted/20 h-96 animate-pulse" />,
});

const ContentSection = dynamic(() => import('@/components/content-5'), {
  loading: () => <div className="bg-muted/20 h-96 animate-pulse" />,
});

const StatsSection = dynamic(() => import('@/components/stats-2'), {
  loading: () => <div className="bg-muted/20 h-64 animate-pulse" />,
});

const Testimonials = dynamic(() => import('@/components/testimonials'), {
  loading: () => <div className="bg-muted/20 h-96 animate-pulse" />,
});

const Pricing = dynamic(() => import('@/components/pricing'), {
  loading: () => <div className="bg-muted/20 h-96 animate-pulse" />,
});

const FooterSection = dynamic(() => import('@/components/footer'));

/**
 * Renders the landing page composed of header, hero, features, content, stats, testimonials, pricing, and footer sections.
 *
 * @returns The React fragment containing the assembled landing page sections.
 */
export default function LandingPage() {
  console.log('[DEBUG] Home page component rendering');
  return (
    <>
      <HeroHeader />
      <HeroSection />
      <Features />
      <ContentSection />
      <StatsSection />
      <Testimonials />
      <Pricing />
      <FooterSection />
    </>
  );
}
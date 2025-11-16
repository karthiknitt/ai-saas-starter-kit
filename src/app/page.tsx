import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { HeroHeader } from '@/components/header';
import HeroSection from '@/components/hero-section';
import { HomePageWrapper } from '@/components/home-page-wrapper';

// Static generation with revalidation - improve Core Web Vitals
export const revalidate = 86400; // Revalidate every 24 hours

// SEO Metadata for better performance and discoverability
export const metadata: Metadata = {
  title: 'AI SaaS Starter Kit - Build Your AI Application Fast',
  description:
    'Production-ready Next.js SaaS starter kit with AI integration, authentication, billing, and more. Launch your AI product faster.',
  keywords: [
    'AI SaaS',
    'Next.js',
    'Starter Kit',
    'AI Integration',
    'React',
    'TypeScript',
  ],
  authors: [{ name: 'AI SaaS Team' }],
  openGraph: {
    title: 'AI SaaS Starter Kit',
    description: 'Build and launch your AI application faster',
    type: 'website',
  },
};

// Lazy load heavy components that don't need to be immediately visible
// Using SSR: false for client-only components improves initial load
const Features = dynamic(() => import('@/components/features-4'), {
  loading: () => <div className="bg-muted/20 h-96 animate-pulse" />,
  ssr: true, // SSR for SEO
});

const ContentSection = dynamic(() => import('@/components/content-5'), {
  loading: () => <div className="bg-muted/20 h-96 animate-pulse" />,
  ssr: true,
});

const StatsSection = dynamic(() => import('@/components/stats-2'), {
  loading: () => <div className="bg-muted/20 h-64 animate-pulse" />,
  ssr: true,
});

const Testimonials = dynamic(() => import('@/components/testimonials'), {
  loading: () => <div className="bg-muted/20 h-96 animate-pulse" />,
  ssr: true,
});

const Pricing = dynamic(() => import('@/components/pricing'), {
  loading: () => <div className="bg-muted/20 h-96 animate-pulse" />,
  ssr: true,
});

const FooterSection = dynamic(() => import('@/components/footer'), {
  ssr: true,
});

/**
 * Landing page with optimized loading and Core Web Vitals improvements
 * - Static generation with 24h revalidation
 * - Lazy loaded components for better TTI (Time to Interactive)
 * - Proper SEO metadata
 * - SSR-enabled for better FCP (First Contentful Paint)
 *
 * @returns The React fragment containing the assembled landing page sections wrapped in HomePageWrapper.
 */
export default function LandingPage() {
  return (
    <HomePageWrapper>
      <HeroHeader />
      <HeroSection />
      <Features />
      <ContentSection />
      <StatsSection />
      <Testimonials />
      <Pricing />
      <FooterSection />
    </HomePageWrapper>
  );
}

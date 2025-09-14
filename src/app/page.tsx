//import Image from 'next/image';
//import { ModeToggle } from '@/components/ui/modetoggle';
import ContentSection from '@/components/content-5';
import Features from '@/components/features-4';
import FooterSection from '@/components/footer';
import { HeroHeader } from '@/components/header';
import HeroSection from '@/components/hero-section';
import StatsSection from '@/components/stats-2';
import Testimonials from '@/components/testimonials';
import Pricing from '@/components/pricing';
/* src\components\ui\modetoggle.tsx
// src\app\page.tsx */

export default function LandingPage() {
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

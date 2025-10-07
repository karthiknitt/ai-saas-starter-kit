'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { HeroHeader } from './header';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';
import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Render the page hero containing the header, primary calls-to-action, hero media, and a scrolling client logo band.
 *
 * The section includes a prominent title and subtitle, animated CTA buttons, an autoplaying hero video background, and an infinite-scrolling list of partner logos with decorative blur and gradient edges.
 *
 * @returns The hero section as a React element
 */
export default function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-x-hidden">
        <section>
          <div className="py-24 md:pb-32 lg:pt-72 lg:pb-36">
            <div className="relative mx-auto flex max-w-7xl flex-col px-6 lg:block lg:px-12">
              <div className="mx-auto max-w-lg text-center lg:ml-0 lg:max-w-full lg:text-left">
                <h1 className="mt-8 max-w-2xl text-5xl text-balance md:text-6xl lg:mt-16 xl:text-7xl">
                  Build 10x Faster with NS
                </h1>
                <p className="mt-8 max-w-2xl text-lg text-balance">
                  Highly customizable components for building modern websites
                  and applications you mean it.
                </p>

                <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      asChild
                      size="lg"
                      className="h-12 rounded-full pr-3 pl-5 text-base"
                    >
                      <Link href="#link">
                        <span className="text-nowrap">Start Building</span>
                        <motion.div
                          whileHover={{ x: 2 }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 10,
                          }}
                        >
                          <ChevronRight className="ml-1" />
                        </motion.div>
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      key={2}
                      asChild
                      size="lg"
                      variant="ghost"
                      className="h-12 rounded-full px-5 text-base hover:bg-zinc-950/5 dark:hover:bg-white/5"
                    >
                      <Link href="#link">
                        <span className="text-nowrap">Request a demo</span>
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
            <div className="absolute inset-1 -z-10 aspect-2/3 overflow-hidden rounded-3xl border border-black/10 lg:aspect-video lg:rounded-[3rem] dark:border-white/5">
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="size-full object-cover opacity-50 invert dark:opacity-35 dark:invert-0 dark:lg:opacity-75"
                src="https://ik.imagekit.io/lrigu76hy/tailark/dna-video.mp4?updatedAt=1745736251477"
              ></video>
            </div>
          </div>
        </section>
        <section className="bg-background pb-2">
          <div className="group relative m-auto max-w-7xl px-6">
            <div className="flex flex-col items-center md:flex-row">
              <div className="md:max-w-44 md:border-r md:pr-6">
                <p className="text-end text-sm">Powering the best teams</p>
              </div>
              <div className="relative py-6 md:w-[calc(100%-11rem)]">
                <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                  <div className="flex">
                    <Image
                      className="mx-auto dark:invert"
                      src="https://html.tailus.io/blocks/customers/nvidia.svg"
                      alt="Nvidia Logo"
                      width={120}
                      height={32}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>

                  <div className="flex">
                    <Image
                      className="mx-auto dark:invert"
                      src="https://html.tailus.io/blocks/customers/column.svg"
                      alt="Column Logo"
                      width={80}
                      height={32}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                  <div className="flex">
                    <Image
                      className="mx-auto dark:invert"
                      src="https://html.tailus.io/blocks/customers/github.svg"
                      alt="GitHub Logo"
                      width={80}
                      height={32}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                  <div className="flex">
                    <Image
                      className="mx-auto dark:invert"
                      src="https://html.tailus.io/blocks/customers/nike.svg"
                      alt="Nike Logo"
                      width={60}
                      height={32}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                  <div className="flex">
                    <Image
                      className="mx-auto dark:invert"
                      src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                      alt="Lemon Squeezy Logo"
                      width={120}
                      height={32}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                  <div className="flex">
                    <Image
                      className="mx-auto dark:invert"
                      src="https://html.tailus.io/blocks/customers/laravel.svg"
                      alt="Laravel Logo"
                      width={100}
                      height={32}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                  <div className="flex">
                    <Image
                      className="mx-auto dark:invert"
                      src="https://html.tailus.io/blocks/customers/lilly.svg"
                      alt="Lilly Logo"
                      width={80}
                      height={32}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>

                  <div className="flex">
                    <Image
                      className="mx-auto dark:invert"
                      src="https://html.tailus.io/blocks/customers/openai.svg"
                      alt="OpenAI Logo"
                      width={100}
                      height={32}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                </InfiniteSlider>

                <div className="from-background absolute inset-y-0 left-0 w-20 bg-linear-to-r"></div>
                <div className="from-background absolute inset-y-0 right-0 w-20 bg-linear-to-l"></div>
                <ProgressiveBlur
                  className="pointer-events-none absolute top-0 left-0 h-full w-20"
                  direction="left"
                  blurIntensity={1}
                />
                <ProgressiveBlur
                  className="pointer-events-none absolute top-0 right-0 h-full w-20"
                  direction="right"
                  blurIntensity={1}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
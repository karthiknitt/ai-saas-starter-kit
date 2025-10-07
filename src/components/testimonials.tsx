'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { motion } from 'motion/react';

/**
 * Renders a responsive, animated testimonials section with multiple testimonial cards.
 *
 * The section includes a centered header and a responsive grid of cards that animate
 * into view and scale on hover; each card contains a quote, an avatar (with fallback),
 * and author metadata.
 *
 * @returns A JSX element representing the testimonials section.
 */
export default function Testimonials() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-4xl font-medium lg:text-5xl">
            Build by makers, loved by thousand developers
          </h2>
          <p>
            Gemini is evolving to be more than just the models. It supports an
            entire to the APIs and platforms helping developers and businesses
            innovate.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="grid grid-rows-[auto_1fr] gap-8 sm:col-span-2 sm:p-6 lg:row-span-2">
              <CardHeader>
                <Image
                  className="dark:invert"
                  src="https://html.tailus.io/blocks/customers/nike.svg"
                  alt="Nike Logo"
                  width={60}
                  height={24}
                />
              </CardHeader>
              <CardContent>
                <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                  <p className="text-xl font-medium">
                    Tailus has transformed the way I develop web applications.
                    Their extensive collection of UI components, blocks, and
                    templates has significantly accelerated my workflow. The
                    flexibility to customize every aspect allows me to create
                    unique user experiences. Tailus is a game-changer for modern
                    web development
                  </p>

                  <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarImage
                        src="https://tailus.io/images/reviews/shekinah.webp"
                        alt="Shekinah Tshiokufila"
                        height="400"
                        width="400"
                        loading="lazy"
                      />
                      <AvatarFallback>ST</AvatarFallback>
                    </Avatar>

                    <div>
                      <cite className="text-sm font-medium">
                        Shekinah Tshiokufila
                      </cite>
                      <span className="text-muted-foreground block text-sm">
                        Software Ingineer
                      </span>
                    </div>
                  </div>
                </blockquote>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="md:col-span-2">
              <CardContent className="h-full pt-6">
                <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                  <p className="text-xl font-medium">
                    Tailus is really extraordinary and very practical, no need
                    to break your head. A real gold mine.
                  </p>

                  <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarImage
                        src="https://tailus.io/images/reviews/jonathan.webp"
                        alt="Jonathan Yombo"
                        height="400"
                        width="400"
                        loading="lazy"
                      />
                      <AvatarFallback>JY</AvatarFallback>
                    </Avatar>
                    <div>
                      <cite className="text-sm font-medium">
                        Jonathan Yombo
                      </cite>
                      <span className="text-muted-foreground block text-sm">
                        Software Ingineer
                      </span>
                    </div>
                  </div>
                </blockquote>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card>
              <CardContent className="h-full pt-6">
                <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                  <p>
                    Great work on tailfolio template. This is one of the best
                    personal website that I have seen so far!
                  </p>

                  <div className="grid [grid-template-columns:auto_1fr] items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarImage
                        src="https://tailus.io/images/reviews/yucel.webp"
                        alt="Yucel Faruksahan"
                        height="400"
                        width="400"
                        loading="lazy"
                      />
                      <AvatarFallback>YF</AvatarFallback>
                    </Avatar>
                    <div>
                      <cite className="text-sm font-medium">
                        Yucel Faruksahan
                      </cite>
                      <span className="text-muted-foreground block text-sm">
                        Creator, Tailkits
                      </span>
                    </div>
                  </div>
                </blockquote>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="card variant-mixed">
              <CardContent className="h-full pt-6">
                <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                  <p>
                    Great work on tailfolio template. This is one of the best
                    personal website that I have seen so far!
                  </p>

                  <div className="grid grid-cols-[auto_1fr] gap-3">
                    <Avatar className="size-12">
                      <AvatarImage
                        src="https://tailus.io/images/reviews/rodrigo.webp"
                        alt="Rodrigo Aguilar"
                        height="400"
                        width="400"
                        loading="lazy"
                      />
                      <AvatarFallback>YF</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Rodrigo Aguilar</p>
                      <span className="text-muted-foreground block text-sm">
                        Creator, TailwindAwesome
                      </span>
                    </div>
                  </div>
                </blockquote>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
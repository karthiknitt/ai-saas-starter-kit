'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Renders a responsive pricing section with three animated pricing tiers: Free, Pro (Popular), and Startup.
 *
 * @returns A JSX element containing the pricing section markup with tiered cards, feature lists, action links, and entry/hover animations.
 */
export default function Pricing() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">
            Pricing that Scales with You
          </h1>
          <p>
            Gemini is evolving to be more than just the models. It supports an
            entire to the APIs and platforms helping developers and businesses
            innovate.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-medium">Free</CardTitle>

                <span className="my-3 block text-2xl font-semibold">
                  $0 / mo
                </span>

                <CardDescription className="text-sm">
                  Per editor
                </CardDescription>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href="/dashboard/subscriptions">Get Started</Link>
                  </Button>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-4">
                <hr className="border-dashed" />

                <ul className="list-outside space-y-3 text-sm">
                  {[
                    'Basic Analytics Dashboard',
                    '5GB Cloud Storage',
                    'Email and Chat Support',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.1 }}>
                        <Check className="size-3" />
                      </motion.div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="relative">
              <span className="absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full bg-linear-to-br/increasing from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-white/20 ring-offset-1 ring-offset-gray-950/5 ring-inset">
                Popular
              </span>

              <CardHeader>
                <CardTitle className="font-medium">Pro</CardTitle>

                <span className="my-3 block text-2xl font-semibold">
                  $19 / mo
                </span>

                <CardDescription className="text-sm">
                  Per editor
                </CardDescription>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    asChild
                    className="mt-4 w-full hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white"
                  >
                    <Link href="/dashboard/subscriptions">Upgrade</Link>
                  </Button>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-4">
                <hr className="border-dashed" />

                <ul className="list-outside space-y-3 text-sm">
                  {[
                    'Everything in Free Plan',
                    '5GB Cloud Storage',
                    'Email and Chat Support',
                    'Access to Community Forum',
                    'Single User Access',
                    'Access to Basic Templates',
                    'Mobile App Access',
                    '1 Custom Report Per Month',
                    'Monthly Product Updates',
                    'Standard Security Features',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.1 }}>
                        <Check className="size-3" />
                      </motion.div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-medium">Startup</CardTitle>

                <span className="my-3 block text-2xl font-semibold">
                  $29 / mo
                </span>

                <CardDescription className="text-sm">
                  Per editor
                </CardDescription>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href="/dashboard/subscriptions">Get Started</Link>
                  </Button>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-4">
                <hr className="border-dashed" />

                <ul className="list-outside space-y-3 text-sm">
                  {[
                    'Everything in Pro Plan',
                    '5GB Cloud Storage',
                    'Email and Chat Support',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.1 }}>
                        <Check className="size-3" />
                      </motion.div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
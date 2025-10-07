'use client';

import { motion } from 'motion/react';

/**
 * Renders a responsive statistics section with three animated statistic cards.
 *
 * The section includes a heading, descriptive paragraph, and three highlighted
 * statistic tiles displayed in a responsive grid.
 *
 * @returns The JSX element for the statistics section.
 */
export default function StatsSection() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center">
          <h2 className="text-4xl font-semibold lg:text-5xl">
            Tailark in numbers
          </h2>
          <p>
            Gemini is evolving to be more than just the models. It supports an
            entire to the APIs and platforms helping developers and businesses
            innovate.
          </p>
        </div>

        <div className="grid gap-0.5 *:text-center md:grid-cols-3 dark:[--color-muted:var(--color-zinc-900)]">
          <motion.div
            className="bg-muted space-y-4 rounded-(--radius) py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-5xl font-bold">+1200</div>
            <p>Stars on GitHub</p>
          </motion.div>
          <motion.div
            className="bg-muted space-y-4 rounded-(--radius) py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-5xl font-bold">56%</div>
            <p>Conversion rate</p>
          </motion.div>
          <motion.div
            className="bg-muted space-y-4 rounded-(--radius) py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-5xl font-bold">+500</div>
            <p>Powered Apps</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
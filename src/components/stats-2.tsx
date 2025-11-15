'use client';

import { Boxes, Star, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Renders a responsive "Tailark in numbers" stats section with three animated metric cards.
 *
 * Each card displays a metric label and value and animates into view with a subtle scale/fade effect and a hover scale interaction.
 *
 * @returns A JSX element containing the stats section with three animated stat cards.
 */
export default function StatsSection() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-4xl font-medium text-balance lg:text-5xl">
            Tailark in numbers
          </h2>
          <p>
            Gemini is evolving to be more than just the models. It supports an
            entire to the APIs and platforms helping developers and businesses
            innovate.
          </p>
        </div>

        <div className="relative mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          <motion.div
            className="border-border/50 bg-card/30 hover:border-border hover:bg-card/50 space-y-6 rounded-2xl border p-8 text-center backdrop-blur-sm transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className="flex justify-center">
              <motion.div
                className="rounded-xl bg-cyan-500/10 p-3"
                whileHover={{ rotate: 10, scale: 1.1 }}
                animate={{ y: [0, -3, 0] }}
                transition={{
                  y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <Star className="size-6 text-cyan-500" />
              </motion.div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold">+1200</div>
              <p className="text-muted-foreground text-sm">Stars on GitHub</p>
            </div>
          </motion.div>

          <motion.div
            className="border-border/50 bg-card/30 hover:border-border hover:bg-card/50 space-y-6 rounded-2xl border p-8 text-center backdrop-blur-sm transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className="flex justify-center">
              <motion.div
                className="rounded-xl bg-emerald-500/10 p-3"
                whileHover={{ rotate: 10, scale: 1.1 }}
                animate={{ y: [0, -3, 0] }}
                transition={{
                  y: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.2,
                  },
                }}
              >
                <TrendingUp className="size-6 text-emerald-500" />
              </motion.div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold">56%</div>
              <p className="text-muted-foreground text-sm">Conversion rate</p>
            </div>
          </motion.div>

          <motion.div
            className="border-border/50 bg-card/30 hover:border-border hover:bg-card/50 space-y-6 rounded-2xl border p-8 text-center backdrop-blur-sm transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className="flex justify-center">
              <motion.div
                className="rounded-xl bg-indigo-500/10 p-3"
                whileHover={{ rotate: 10, scale: 1.1 }}
                animate={{ y: [0, -3, 0] }}
                transition={{
                  y: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.4,
                  },
                }}
              >
                <Boxes className="size-6 text-indigo-500" />
              </motion.div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold">+500</div>
              <p className="text-muted-foreground text-sm">Powered Apps</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

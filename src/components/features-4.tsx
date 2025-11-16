'use client';

import {
  Cpu,
  Fingerprint,
  Pencil,
  Settings2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Render a responsive features section describing the foundation for creative teams management.
 *
 * Each feature is presented as an animated card with an icon, title, and description; cards fade and slide into view with staggered delays and slightly scale/rotate on hover to enhance interactivity.
 *
 * @returns The section element containing the features grid with animated feature cards.
 */
export default function Features() {
  return (
    <section id="features" className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-4xl font-medium text-balance lg:text-5xl">
            The foundation for creative teams management
          </h2>
          <p>
            Lyra is evolving to be more than just the models. It supports an
            entire to the APIs and platforms helping developers and businesses
            innovate.
          </p>
        </div>

        <div className="relative mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            className="border-border/50 bg-card/30 hover:border-border hover:bg-card/50 space-y-3 rounded-2xl border p-8 backdrop-blur-sm transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="rounded-xl bg-yellow-500/10 p-2.5"
                whileHover={{ rotate: 10, scale: 1.1 }}
                animate={{ y: [0, -3, 0] }}
                transition={{
                  y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <Zap className="size-5 text-yellow-500" />
              </motion.div>
              <h3 className="text-base font-medium">Faaast</h3>
            </div>
            <p className="text-sm">
              It supports an entire helping developers and innovate.
            </p>
          </motion.div>
          <motion.div
            className="border-border/50 bg-card/30 hover:border-border hover:bg-card/50 space-y-3 rounded-2xl border p-8 backdrop-blur-sm transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="rounded-xl bg-blue-500/10 p-2.5"
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
                <Cpu className="size-5 text-blue-500" />
              </motion.div>
              <h3 className="text-base font-medium">Powerful</h3>
            </div>
            <p className="text-sm">
              It supports an entire helping developers and businesses.
            </p>
          </motion.div>
          <motion.div
            className="border-border/50 bg-card/30 hover:border-border hover:bg-card/50 space-y-3 rounded-2xl border p-8 backdrop-blur-sm transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="rounded-xl bg-green-500/10 p-2.5"
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
                <Fingerprint className="size-5 text-green-500" />
              </motion.div>
              <h3 className="text-base font-medium">Security</h3>
            </div>
            <p className="text-sm">
              It supports an helping developers businesses.
            </p>
          </motion.div>
          <motion.div
            className="border-border/50 bg-card/30 hover:border-border hover:bg-card/50 space-y-3 rounded-2xl border p-8 backdrop-blur-sm transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="rounded-xl bg-teal-500/10 p-2.5"
                whileHover={{ rotate: 10, scale: 1.1 }}
                animate={{ y: [0, -3, 0] }}
                transition={{
                  y: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.6,
                  },
                }}
              >
                <Pencil className="size-5 text-teal-500" />
              </motion.div>
              <h3 className="text-base font-medium">Customization</h3>
            </div>
            <p className="text-sm">
              It supports helping developers and businesses innovate.
            </p>
          </motion.div>
          <motion.div
            className="border-border/50 bg-card/30 hover:border-border hover:bg-card/50 space-y-3 rounded-2xl border p-8 backdrop-blur-sm transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="rounded-xl bg-orange-500/10 p-2.5"
                whileHover={{ rotate: 10, scale: 1.1 }}
                animate={{ y: [0, -3, 0] }}
                transition={{
                  y: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.8,
                  },
                }}
              >
                <Settings2 className="size-5 text-orange-500" />
              </motion.div>
              <h3 className="text-base font-medium">Control</h3>
            </div>
            <p className="text-sm">
              It supports helping developers and businesses innovate.
            </p>
          </motion.div>
          <motion.div
            className="border-border/50 bg-card/30 hover:border-border hover:bg-card/50 space-y-3 rounded-2xl border p-8 backdrop-blur-sm transition-colors"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="rounded-xl bg-rose-500/10 p-2.5"
                whileHover={{ rotate: 10, scale: 1.1 }}
                animate={{ y: [0, -3, 0] }}
                transition={{
                  y: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1.0,
                  },
                }}
              >
                <Sparkles className="size-5 text-rose-500" />
              </motion.div>
              <h3 className="text-base font-medium">Built for AI</h3>
            </div>
            <p className="text-sm">
              It supports helping developers and businesses innovate.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

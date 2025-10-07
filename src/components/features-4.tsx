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
 * Render the static features section that showcases six feature tiles.
 *
 * Each tile reveals with a staggered fade-and-slide animation and includes
 * subtle hover interactions on the tile and its icon.
 *
 * @returns A React element containing the features section with animated tiles
 */
export default function Features() {
  return (
    <section className="py-12 md:py-20">
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

        <div className="relative mx-auto grid max-w-4xl divide-x divide-y border *:p-12 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 10 }}>
                <Zap className="size-4" />
              </motion.div>
              <h3 className="text-sm font-medium">Faaast</h3>
            </div>
            <p className="text-sm">
              It supports an entire helping developers and innovate.
            </p>
          </motion.div>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 10 }}>
                <Cpu className="size-4" />
              </motion.div>
              <h3 className="text-sm font-medium">Powerful</h3>
            </div>
            <p className="text-sm">
              It supports an entire helping developers and businesses.
            </p>
          </motion.div>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 10 }}>
                <Fingerprint className="size-4" />
              </motion.div>
              <h3 className="text-sm font-medium">Security</h3>
            </div>
            <p className="text-sm">
              It supports an helping developers businesses.
            </p>
          </motion.div>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 10 }}>
                <Pencil className="size-4" />
              </motion.div>
              <h3 className="text-sm font-medium">Customization</h3>
            </div>
            <p className="text-sm">
              It supports helping developers and businesses innovate.
            </p>
          </motion.div>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 10 }}>
                <Settings2 className="size-4" />
              </motion.div>
              <h3 className="text-sm font-medium">Control</h3>
            </div>
            <p className="text-sm">
              It supports helping developers and businesses innovate.
            </p>
          </motion.div>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 10 }}>
                <Sparkles className="size-4" />
              </motion.div>
              <h3 className="text-sm font-medium">Built for AI</h3>
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
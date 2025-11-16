'use client';

import { Cpu, Lock, Sparkles, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

/**
 * Renders the content section for the Lyra ecosystem, including a heading,
 * descriptive paragraph, a large image, and a responsive grid of four feature cards.
 *
 * Each feature card contains an icon, a short title, and a brief description.
 *
 * @returns The section's JSX element containing the heading, image, and feature grid.
 */
export default function ContentSection() {
  return (
    <section id="solution" className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
        <div className="mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-4xl font-medium text-balance lg:text-5xl">
            The Lyra ecosystem brings together our models, products and
            platforms.
          </h2>
          <p>
            Lyra is evolving to be more than just the models. It supports an
            entire ecosystem — from products to the APIs and platforms helping
            developers and businesses innovate.
          </p>
        </div>
        <Image
          className="rounded-(--radius) grayscale"
          src="https://images.unsplash.com/photo-1616587226960-4a03badbe8bf?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="team image"
          width={2940}
          height={1960}
          loading="lazy"
        />

        <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 10 }}>
                <Zap className="size-4" />
              </motion.div>
              <h3 className="text-sm font-medium">Faaast</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              It supports an entire helping developers and innovate.
            </p>
          </motion.div>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 10 }}>
                <Cpu className="size-4" />
              </motion.div>
              <h3 className="text-sm font-medium">Powerful</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              It supports an entire helping developers and businesses.
            </p>
          </motion.div>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 10 }}>
                <Lock className="size-4" />
              </motion.div>
              <h3 className="text-sm font-medium">Security</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              It supports an helping developers businesses innovate.
            </p>
          </motion.div>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ rotate: 10 }}>
                <Sparkles className="size-4" />
              </motion.div>
              <h3 className="text-sm font-medium">AI Powered</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              It supports an helping developers businesses innovate.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

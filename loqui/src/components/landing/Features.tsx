"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";

const features = [
  {
    title: "Upload Samples",
    description: "Easily upload audio samples in multiple formats.",
  },
  {
    title: "Generate Voices",
    description: "Create AI voiceovers from scripts with one click.",
  },
  {
    title: "Manage Library",
    description: "Organize, preview, and delete generated audio.",
  },
  {
    title: "Share & Download",
    description: "Export and share results with your team.",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });

  const y1 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.8]);

  return (
    <section ref={sectionRef} className="relative h-screen snap-start flex flex-col items-center justify-center mx-auto max-w-6xl px-6">
      <div className="mb-10 rounded-xl bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-800 px-8 py-6 transition-all duration-500">
        <motion.h2 style={{ opacity }} className="text-3xl md:text-4xl font-bold text-center tracking-tight transition-colors duration-500">
          High Quality Narrations
        </motion.h2>
        <motion.p style={{ opacity }} className="mt-2 text-muted-foreground max-w-prose transition-colors duration-500">
          Built with accessibility and performance in mind, powered by HeroUI and Framer Motion.
        </motion.p>
      </div>
      <motion.div style={{ y: y1, opacity }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 shadow-md backdrop-blur-md p-5 text-left transition-all duration-500">
            <h3 className="text-lg font-semibold transition-colors duration-500">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 transition-colors duration-500">{f.description}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}



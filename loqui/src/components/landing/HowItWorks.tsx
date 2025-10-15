"use client";

import { motion } from "framer-motion";

const steps = [
  { title: "1. Upload", desc: "Add a short audio sample to start." },
  { title: "2. Script", desc: "Write or paste the text you want spoken." },
  { title: "3. Generate", desc: "Create your AI voiceover in seconds." },
];

export default function HowItWorks() {
  return (
    <section className="h-screen snap-start flex items-center">
      <div className="mx-auto max-w-6xl px-6 w-full text-left">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How it works</h2>
        <p className="mt-2 text-muted-foreground max-w-prose">
          A minimal, fast flow—designed to help you ship audio quickly.
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true, margin: "-20%" }}
              className="rounded-lg border bg-background/60 shadow-sm backdrop-blur p-5"
            >
              <div className="text-sm text-muted-foreground">Step {i + 1}</div>
              <div className="text-lg font-semibold mt-1">{s.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}




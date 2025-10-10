"use client";

import { useRouter } from "next/navigation";

export default function CTA() {
  const router = useRouter();

  return (
    <section className="h-screen snap-start flex items-center">
      <div className="mx-auto max-w-3xl px-6 w-full text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Create your first voiceover</h2>
        <p className="mt-2 text-muted-foreground">
          No credit card required. Sign in and start generating in less than a minute.
        </p>
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push("/signin")}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}




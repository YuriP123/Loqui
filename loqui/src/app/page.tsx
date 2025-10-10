"use client";

import ParticleFloorLanding from "@/components/ParticleFloor";
import { useRouter } from "next/navigation";
import FeaturesSection from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Landing() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to light theme colors until mounted
  const particleColor = mounted && theme === "dark" ? "white" : "black";
  const backgroundColor = mounted && theme === "dark" ? "black" : "white";

  return (
    <main className="relative min-h-screen w-full">
      <ParticleFloorLanding 
        asBackground 
        tiltDeg={55} 
        yawDeg={25} 
        color={particleColor} 
        background={backgroundColor} 
      />
      
      {/* Theme Toggle Button - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      <section className="relative z-10 h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="rounded-2xl bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-800 px-12 py-16 transition-all duration-500">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight transition-colors duration-500">Loqui.io</h1>
          <p className="mt-4 text-muted-foreground max-w-prose italic transition-colors duration-500">To Speak.</p>
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={() => router.push("/signin")}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-all duration-300"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      <section className="relative z-10">
        <FeaturesSection />
      </section>
      <section className="relative z-10">
        <Footer />
      </section>
    </main>
  );
}

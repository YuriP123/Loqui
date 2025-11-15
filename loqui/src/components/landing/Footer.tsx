"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="h-screen snap-start flex flex-col justify-center items-center border-t transition-colors duration-500">
      <div className="mx-auto max-w-6xl px-6 py-10 rounded-xl bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-800 transition-all duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left px-8 py-6">
          <div>
            <div className="font-semibold text-lg transition-colors duration-500">Product</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground transition-colors duration-500">
              <li><Link href="#" className="hover:text-foreground transition-colors duration-200">Home</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors duration-200">Pricing</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors duration-200">Docs</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-lg transition-colors duration-500">Company</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground transition-colors duration-500">
              <li><Link href="#" className="hover:text-foreground transition-colors duration-200">Terms</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors duration-200">Privacy</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors duration-200">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-lg transition-colors duration-500">Social</div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground transition-colors duration-500">
              <li><Link href="#" className="hover:text-foreground transition-colors duration-200">Twitter</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors duration-200">LinkedIn</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors duration-200">Discord</Link></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground pt-6 pb-2 transition-colors duration-500">© {year || 2025} Loqui</div>
      </div>
    </footer>
  );
}



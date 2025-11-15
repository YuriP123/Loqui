"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page immediately
    router.replace("/home");
  }, [router]);

  // Return null to avoid rendering anything during redirect
  return null;
}

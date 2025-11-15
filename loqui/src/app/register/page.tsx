"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Input, Button } from "@heroui/react";
import ParticleFloorLanding from "@/components/ParticleFloor";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { register, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/home");
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await register({ username, email, password });
      // Register function handles login and redirect
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        // Handle network errors or other Error instances
        if (err.message.includes('fetch') || err.message.includes('network')) {
          setError("Cannot connect to server. Please make sure the backend is running on port 8000.");
        } else {
          setError(err.message || "An unexpected error occurred. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      setLoading(false);
    }
  }

  const particleColor = mounted && theme === "dark" ? "white" : "black";
  const backgroundColor = mounted && theme === "dark" ? "black" : "white";

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-16">
      <ParticleFloorLanding 
        asBackground 
        tiltDeg={45} 
        yawDeg={20} 
        color={particleColor} 
        background={backgroundColor} 
      />
      
      {/* Back Button */}
      <button
        onClick={() => router.push("/")}
        className="fixed top-6 left-6 z-50 rounded-full p-3 border border-gray-200 dark:border-gray-800 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg hover:bg-gray-200/90 dark:hover:bg-gray-800/90 transition-all duration-300 hover:scale-110 group"
        aria-label="Back to home"
      >
        <ArrowLeft className="h-5 w-5 transition-all duration-300 group-hover:-translate-x-0.5" />
      </button>

      {/* Theme Toggle Button */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-md p-8 shadow-lg transition-all duration-500">
        <h1 className="text-3xl font-bold transition-colors duration-500">Register</h1>
        <p className="text-muted-foreground mt-2 transition-colors duration-500">Create your Loqui account</p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200 transition-all duration-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="text-left space-y-2">
            <label className="block text-sm font-medium transition-colors duration-500">Username</label>
            <Input
              type="text"
              isRequired
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              classNames={{
                input: "bg-transparent transition-colors duration-500",
                inputWrapper: "bg-gray-50/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300",
              }}
            />
          </div>
          <div className="text-left space-y-2">
            <label className="block text-sm font-medium transition-colors duration-500">Email</label>
            <Input
              type="email"
              isRequired
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              classNames={{
                input: "bg-transparent transition-colors duration-500",
                inputWrapper: "bg-gray-50/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300",
              }}
            />
          </div>
          <div className="text-left space-y-2">
            <label className="block text-sm font-medium transition-colors duration-500">Password</label>
            <Input
              type="password"
              isRequired
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              classNames={{
                input: "bg-transparent transition-colors duration-500",
                inputWrapper: "bg-gray-50/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300",
              }}
            />
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              type="submit" 
              isDisabled={loading} 
              isLoading={loading} 
              color="primary" 
              className="w-full transition-all duration-300"
            >
              Create account
            </Button>
            <Button 
              type="button" 
              variant="bordered" 
              onPress={() => router.push("/signin")}
              className="w-full border-gray-300 dark:border-gray-700 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-all duration-300"
            >
              Already have an account?
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
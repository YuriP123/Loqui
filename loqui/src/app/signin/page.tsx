"use client";

import { Suspense, useState, useEffect } from "react";
import { Input, Button } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import ParticleFloorLanding from "@/components/ParticleFloor";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { login, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    
    try {
      // Call login API using context
      await login(username, password);
      
      // Login successful - redirect to home
      router.replace("/home");
    } catch (error: any) {
      setErrorMessage(error.message || "Login failed. Please check your credentials.");
    } finally {
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
        <h1 className="text-3xl font-bold transition-colors duration-500">Sign in</h1>
        <p className="text-muted-foreground mt-2 transition-colors duration-500">Start creating with Loqui</p>

        {searchParams.get("created") && (
          <div className="mt-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/80 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-200 transition-all duration-500">
            Account created. You can now sign in.
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200 transition-all duration-500">
            {errorMessage}
          </div>
        )}

        {searchParams.get("expired") && (
          <div className="mt-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/80 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200 transition-all duration-500">
            Your session has expired. Please sign in again.
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
              placeholder="your username"
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
              Sign In
            </Button>
            <Button 
              type="button" 
              variant="bordered" 
              onPress={() => router.push("/register")}
              className="w-full border-gray-300 dark:border-gray-700 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-all duration-300"
            >
              Create an account
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center px-6 py-16"><div className="text-sm text-muted-foreground">Loading…</div></main>}>
      <SignInContent />
    </Suspense>
  );
}

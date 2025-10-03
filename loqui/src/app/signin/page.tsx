"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Replace with real registration API call
      await new Promise((r) => setTimeout(r, 600));
      router.replace("/home");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-muted-foreground mt-1">Start creating with Loqui</p>

        {searchParams.get("created") && (
          <div className="mt-4 rounded-md border bg-muted p-3 text-sm">
            Account created. You can now sign in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="text-left">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="you@example.com"
            />
          </div>
          <div className="text-left">
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="••••••••"
            />
          </div>
          <div className="flex flex-row justify-around">
            <button
              type="submit"
              disabled={loading}
              className="w-auto rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="w-auto rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Register an account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

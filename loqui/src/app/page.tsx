import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Welcome to Loqui</h1>
      <p className="mt-4 text-muted-foreground max-w-prose">
        A simple tool to create AI voiceovers.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import GenerationCard, { type GenerationItem } from "@/components/generation-card";
import { Sparkles, Upload } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  // Mock data - replace with actual data from backend
  const recentGenerations: GenerationItem[] = [
    {
      id: "1",
      title: "Welcome Message",
      voiceSample: "My Voice Sample 1",
      scriptPreview: "Welcome to Loqui! This is your first AI-generated voice narration...",
      duration: "0:45",
      generatedDate: "2 hours ago",
      status: "completed",
    },
  ];

  return (
    <div className="flex flex-1 flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-background">
        <h1 className="text-2xl font-semibold transition-colors duration-500">Home</h1>
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section - Recent Generations */}
        <section className="flex-1 p-6 border-b bg-muted/20 overflow-auto">
          <h2 className="text-lg font-medium mb-4 transition-colors duration-500">
            Recent Generations
          </h2>
          
          {recentGenerations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentGenerations.map((item) => (
                <GenerationCard
                  key={item.id}
                  item={item}
                  onPlay={(id) => console.log("Play", id)}
                  onDownload={(id) => console.log("Download", id)}
                  onDelete={(id) => console.log("Delete", id)}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium transition-colors duration-500">
                    No generations yet
                  </h3>
                  <p className="text-muted-foreground mt-2 transition-colors duration-500">
                    Get started by creating your first AI voice generation!
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/lab")}
                  size="lg"
                  className="transition-all duration-300"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Your First Generation
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Bottom Section - Quick Actions */}
        <section className="flex-1 p-6 overflow-auto">
          <h2 className="text-lg font-medium mb-4 transition-colors duration-500">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            {/* Create New Generation Card */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md p-6 shadow-md transition-all duration-500 hover:shadow-lg">
              <div className="space-y-4">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold transition-colors duration-500">
                    Create New Generation
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 transition-colors duration-500">
                    Select a voice sample, enter your script, and generate AI voice narration.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/lab")}
                  className="w-full transition-all duration-300"
                >
                  Go to Lab
                </Button>
              </div>
            </div>

            {/* Upload Voice Sample Card */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md p-6 shadow-md transition-all duration-500 hover:shadow-lg">
              <div className="space-y-4">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold transition-colors duration-500">
                    Upload Voice Sample
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 transition-colors duration-500">
                    Add a new voice sample to use in your AI voice generations.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/my-voices")}
                  variant="outline"
                  className="w-full transition-all duration-300"
                >
                  Upload Sample
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}



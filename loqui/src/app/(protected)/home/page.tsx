"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import GenerationCard, { type GenerationItem } from "@/components/generation-card";
import { Sparkles, Upload } from "lucide-react";
import * as generationApi from "@/lib/api/generation";
import * as samplesApi from "@/lib/api/samples";
import { API_BASE_URL } from "@/lib/api-client";
import type { AudioSample, AudioSampleListResponse } from "@/lib/api-types";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { clearCache } from "@/lib/api-client";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [recentGenerations, setRecentGenerations] = useState<GenerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSamples: 0, totalGenerations: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch generations and samples (both are wrapped responses)
      const [genResp, samplesResp] = await Promise.all([
        generationApi.listGenerations(),
        samplesApi.listSamples(),
      ]);

      const generationsData = (genResp as any).generations ?? [];
      const samplesData = (samplesResp as AudioSampleListResponse).samples ?? [];

      // Create a map of samples for quick lookup (keyed by sample_id)
      const sampleMap = new Map(samplesData.map((s: AudioSample) => [s.sample_id, s]));

      // Get the 3 most recent generations
      const sortedGenerations = [...generationsData]
        .sort(
          (a: any, b: any) =>
            new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
        )
        .slice(0, 3);

      // Convert to GenerationItem format with backend field names
      const items: GenerationItem[] = sortedGenerations.map((gen: any) => {
        const sample = sampleMap.get(gen.sample_id);
        const normalizedStatus: 'processing' | 'completed' | 'failed' =
          gen.status === 'completed' ? 'completed' : gen.status === 'failed' ? 'failed' : 'processing';
        return {
          id: String(gen.audio_id),
          title: gen.model_name,
          voiceSample: sample?.sample_name || 'Unknown Sample',
          scriptPreview:
            gen.script_text.substring(0, 100) + (gen.script_text.length > 100 ? '...' : ''),
          duration: gen.duration_seconds ? `${Math.floor(gen.duration_seconds / 60)}:${Math.floor(gen.duration_seconds % 60).toString().padStart(2, '0')}` : 'Unknown',
          generatedDate: formatDate(gen.generated_at),
          status: normalizedStatus,
          audioUrl: gen.output_file_path ? `${API_BASE_URL}/api/library/download/generated/${gen.audio_id}` : undefined,
        };
      });

      setRecentGenerations(items);
      setStats({
        totalSamples: samplesData.length,
        totalGenerations: generationsData.length,
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data: " + getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-1 flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold transition-colors duration-500">
            Welcome back{user?.username ? `, ${user.username}` : ''}!
          </h1>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{stats.totalSamples} voice samples</span>
            <span>{stats.totalGenerations} generations</span>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section - Recent Generations */}
        <section className="flex-1 p-6 border-b bg-muted/20 overflow-auto">
          <h2 className="text-lg font-medium mb-4 transition-colors duration-500">
            Recent Generations
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : recentGenerations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentGenerations.map((item) => (
                <GenerationCard
                  key={item.id}
                  item={item}
                  onPlay={(id) => {
                    const gen = recentGenerations.find(g => g.id === id);
                    if (gen?.audioUrl) window.open(gen.audioUrl, '_blank');
                  }}
                  onDownload={(id) => {
                    const gen = recentGenerations.find(g => g.id === id);
                    if (gen?.audioUrl) window.open(gen.audioUrl, '_blank');
                  }}
                  onDelete={async (id) => {
                    if (confirm("Delete this generation?")) {
                      // Optimistically remove from UI
                      const generationToDelete = recentGenerations.find(g => g.id === id);
                      setRecentGenerations(prev => prev.filter(g => g.id !== id));
                      // Update stats optimistically
                      setStats(prev => ({ ...prev, totalGenerations: Math.max(0, prev.totalGenerations - 1) }));
                      
                      try {
                        await generationApi.deleteGeneration(parseInt(id));
                        
                        // Clear cache to ensure fresh data
                        clearCache('/api/generation/');
                        
                        // Refresh data to ensure consistency
                        await fetchData();
                        
                        toast.success("Generation deleted successfully");
                      } catch (error: any) {
                        console.error("Delete failed:", error);
                        // Restore the item if deletion failed
                        if (generationToDelete) {
                          setRecentGenerations(prev => [...prev, generationToDelete]);
                          setStats(prev => ({ ...prev, totalGenerations: prev.totalGenerations + 1 }));
                        }
                        toast.error(`Failed to delete: ${getErrorMessage(error)}`);
                      }
                    }
                  }}
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



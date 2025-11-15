"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GenerationCard, { type GenerationItem } from "@/components/generation-card";
import AudioPlayer from "@/components/audio-player";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import * as generationApi from "@/lib/api/generation";
import * as samplesApi from "@/lib/api/samples";
import { API_BASE_URL, apiDownload, clearCache } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import type { GeneratedAudio, AudioSample } from "@/lib/api-types";

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
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? '' : 's'} ago`;
}

export default function GenerationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [generations, setGenerations] = useState<GenerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [samplesMap, setSamplesMap] = useState<Map<number, AudioSample>>(new Map());
  const [playingGeneration, setPlayingGeneration] = useState<GenerationItem | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both generations and samples (both return wrapped responses)
      const [genResp, samplesResp] = await Promise.all([
        generationApi.listGenerations(),
        samplesApi.listSamples(),
      ]);

      const generationsData = genResp.generations || [];
      const samplesData = samplesResp.samples || [];

      // Create a map of samples for quick lookup (keyed by sample_id)
      const sampleMap = new Map(samplesData.map(s => [s.sample_id, s]));
      setSamplesMap(sampleMap);

      // Convert to GenerationItem format with backend field names
      const items: GenerationItem[] = generationsData.map((gen: GeneratedAudio) => {
        const sample = sampleMap.get(gen.sample_id);
        const normalizedStatus: 'processing' | 'completed' | 'failed' =
          gen.status === 'completed' ? 'completed' : gen.status === 'failed' ? 'failed' : 'processing';
        
        return {
          id: gen.audio_id.toString(),
          title: gen.model_name,
          voiceSample: sample?.sample_name || 'Unknown Sample',
          scriptPreview: gen.script_text.substring(0, 100) + (gen.script_text.length > 100 ? '...' : ''),
          duration: gen.duration_seconds 
            ? `${Math.floor(gen.duration_seconds / 60)}:${Math.floor(gen.duration_seconds % 60).toString().padStart(2, '0')}` 
            : "Unknown",
          generatedDate: formatDate(gen.generated_at),
          status: normalizedStatus,
          audioUrl: gen.output_file_path ? `${API_BASE_URL}/api/library/download/generated/${gen.audio_id}` : undefined,
        };
      });

      setGenerations(items);
    } catch (error) {
      console.error("Failed to fetch generations:", error);
      toast.error("Failed to load generations: " + getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredGenerations = generations.filter((gen) =>
    gen.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gen.scriptPreview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gen.voiceSample.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDownload = async () => {
    const completedItems = selectedItems.filter(id => {
      const gen = generations.find(g => g.id === id);
      return gen?.status === 'completed' && gen?.audioUrl;
    });

    if (completedItems.length === 0) {
      toast.error("No completed generations to download");
      return;
    }

    // Download each file with authentication
    for (const id of completedItems) {
      try {
        const blob = await apiDownload(`/api/library/download/generated/${id}`);
        const url = URL.createObjectURL(blob);
        const gen = generations.find(g => g.id === id);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${gen?.title || 'generated'}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to download ${id}:`, error);
      }
    }
    toast.success(`Downloading ${completedItems.length} file${completedItems.length === 1 ? '' : 's'}`);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedItems.length} selected generation${selectedItems.length === 1 ? '' : 's'}?`)) {
      return;
    }

    // Optimistically remove from UI
    const itemsToDelete = generations.filter(g => selectedItems.includes(g.id));
    setGenerations(prev => prev.filter(g => !selectedItems.includes(g.id)));
    const previousSelected = [...selectedItems];
    setSelectedItems([]);

    try {
      console.log("Bulk deleting:", previousSelected);
      const results = await Promise.allSettled(
        previousSelected.map(id => generationApi.deleteGeneration(parseInt(id)))
      );
      
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.error("Some deletes failed:", failed);
        // Restore failed items
        const failedIds = previousSelected.filter((id, index) => results[index].status === 'rejected');
        const failedItems = itemsToDelete.filter(item => failedIds.includes(item.id));
        setGenerations(prev => [...prev, ...failedItems]);
        setSelectedItems(failedIds);
        toast.error(`Failed to delete ${failed.length} out of ${previousSelected.length} items`);
      } else {
        console.log("All deletes successful");
        toast.success(`Deleted ${previousSelected.length} generation${previousSelected.length === 1 ? '' : 's'}`);
      }
      
      // Clear cache to ensure fresh data
      clearCache('/api/generation/');
      
      // Refresh the list to ensure consistency
      await fetchData();
    } catch (error: any) {
      console.error("Bulk delete failed:", error);
      // Restore all items if bulk delete failed
      setGenerations(prev => [...prev, ...itemsToDelete]);
      setSelectedItems(previousSelected);
      toast.error(`Failed to delete: ${getErrorMessage(error)}`);
    }
  };

  const handlePlay = (id: string) => {
    const gen = generations.find(g => g.id === id);
    if (gen?.audioUrl) {
      setPlayingGeneration(gen);
    }
  };

  const handleDownload = async (id: string) => {
    const gen = generations.find(g => g.id === id);
    if (!gen?.audioUrl) {
      toast.error("Audio file not available");
      return;
    }

    try {
      const blob = await apiDownload(`/api/library/download/generated/${id}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${gen.title || 'generated'}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download: " + getErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this generation?")) {
      return;
    }

    // Optimistically remove from UI
    const generationToDelete = generations.find(g => g.id === id);
    setGenerations(prev => prev.filter(g => g.id !== id));

    try {
      console.log("Deleting generation:", id);
      await generationApi.deleteGeneration(parseInt(id));
      
      // Clear cache to ensure fresh data
      clearCache('/api/generation/');
      
      // Refresh the list to ensure consistency
      await fetchData();
      
      toast.success("Generation deleted successfully");
    } catch (error: any) {
      console.error("Delete failed:", error);
      console.error("Error details:", error.message, error.status);
      // Restore the item if deletion failed
      if (generationToDelete) {
        setGenerations(prev => [...prev, generationToDelete]);
      }
      toast.error(`Failed to delete generation: ${getErrorMessage(error)}`);
    }
  };

  const handleRegenerate = async (id: string) => {
    const gen = generations.find(g => g.id === id);
    if (!gen) return;

    // Navigate to lab with pre-filled data (you could implement this with query params)
    router.push('/lab');
  };

  return (
    <div className="flex flex-1 flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold transition-colors duration-500">
            Generations
          </h1>
          <div className="text-sm text-muted-foreground transition-colors duration-500">
            {generations.length} {generations.length === 1 ? "generation" : "generations"}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden p-6">
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search generations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-all duration-300"
              />
            </div>
            <Button variant="outline" className="transition-all duration-300">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="rounded-lg border border-primary bg-primary/5 p-3 flex items-center justify-between transition-all duration-500">
              <span className="text-sm font-medium transition-colors duration-500">
                {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDownload}
                  className="transition-all duration-300"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedItems([])}
                  className="transition-all duration-300"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Generations List */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredGenerations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGenerations.map((item) => (
                  <div
                    key={item.id}
                    className={`relative ${
                      selectedItems.includes(item.id) ? "ring-2 ring-primary rounded-lg" : ""
                    }`}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                    <GenerationCard
                      item={item}
                      onPlay={handlePlay}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                      onRegenerate={handleRegenerate}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium transition-colors duration-500">
                    No generations found
                  </p>
                  <p className="text-muted-foreground transition-colors duration-500">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "Create your first generation in the Lab"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination Placeholder */}
          {filteredGenerations.length > 0 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" disabled className="transition-all duration-300">
                Previous
              </Button>
              <span className="text-sm text-muted-foreground transition-colors duration-500">
                Page 1 of 1
              </span>
              <Button variant="outline" size="sm" disabled className="transition-all duration-300">
                Next
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Audio Player Modal */}
      {playingGeneration && playingGeneration.audioUrl && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold transition-colors duration-500">
                {playingGeneration.title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlayingGeneration(null)}
                className="transition-all duration-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AudioPlayer
              audioUrl={playingGeneration.audioUrl}
              title={playingGeneration.title}
              key={`play-${playingGeneration.id}`}
              onDownload={async () => {
                try {
                  const blob = await apiDownload(`/api/library/download/generated/${playingGeneration.id}`);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${playingGeneration.title || 'generated'}.wav`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success("Download started");
                } catch (error) {
                  toast.error("Failed to download: " + getErrorMessage(error));
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


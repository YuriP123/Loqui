"use client";

import { useState, useEffect } from "react";
import FileUploader from "@/components/file-uploader";
import RecorderModal from "@/components/recorder-modal";
import VoiceSampleCard, { type VoiceSample } from "@/components/voice-sample-card";
import AudioPlayer from "@/components/audio-player";
import { Upload, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as samplesApi from "@/lib/api/samples";
import type { AudioSample, AudioSampleListResponse } from "@/lib/api-types";
import { API_BASE_URL, apiDownload } from "@/lib/api-client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { clearCache } from "@/lib/api-client";

function formatDuration(seconds?: number): string {
  if (!seconds && seconds !== 0) return "Unknown";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function convertToVoiceSample(sample: AudioSample): VoiceSample {
  return {
    id: String(sample.sample_id),
    name: sample.sample_name,
    duration: formatDuration(sample.duration_seconds),
    uploadDate: formatDate(sample.uploaded_at),
    status: "ready", // Mark as ready when persisted
    audioUrl: `${API_BASE_URL}/api/library/download/sample/${sample.sample_id}`,
  };
}

export default function MyVoicesPage() {
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isRecorderModalOpen, setIsRecorderModalOpen] = useState(false);
  const [playingSample, setPlayingSample] = useState<VoiceSample | null>(null);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const response = await samplesApi.listSamples();
      const samples = (response as AudioSampleListResponse).samples ?? [];
      setVoiceSamples((prev) => {
        // Keep any local processing/failed entries while uploading until the refresh completes
        const localOnly = prev.filter((s) => s.id.startsWith("temp-"));
        const server = samples.map(convertToVoiceSample);
        return [...localOnly, ...server];
      });
      setError("");
    } catch (err: any) {
      console.error("Failed to fetch samples:", err);
      setError("Failed to load voice samples");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  const addProcessingPlaceholder = (sampleName: string): string => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setVoiceSamples((prev) => [
      {
        id: tempId,
        name: sampleName,
        duration: "Processing…",
        uploadDate: "Just now",
        status: "processing",
      },
      ...prev,
    ]);
    return tempId;
  };

  const markPlaceholderFailed = (tempId: string) => {
    setVoiceSamples((prev) =>
      prev.map((s) => (s.id === tempId ? { ...s, status: "failed", duration: "Unknown" } : s))
    );
  };

  const removePlaceholder = (tempId: string) => {
    setVoiceSamples((prev) => prev.filter((s) => s.id !== tempId));
  };

  const handlePlay = (id: string) => {
    const s = voiceSamples.find(v => v.id === id);
    if (s?.audioUrl) {
      setPlayingSample(s);
    } else {
      toast.error("Audio URL not available for this sample");
    }
  };

  const handleFileUpload = async (file: File, sampleName: string) => {
    // Optimistic processing card
    const tempId = addProcessingPlaceholder(sampleName);
    try {
      await samplesApi.uploadSample({
        sample_name: sampleName,
        upload_type: 'uploaded',
        file,
      });
      // Refresh list and remove placeholder (server entry appears as ready)
      await fetchSamples();
      removePlaceholder(tempId);
    } catch (err: any) {
      console.error("Upload failed:", err);
      markPlaceholderFailed(tempId);
      throw err;
    }
  };

  const handleRecordingUpload = async (audioBlob: Blob, sampleName: string) => {
    const tempId = addProcessingPlaceholder(sampleName);
    try {
      // Determine file extension and mime type from blob
      let extension = 'webm';
      let mimeType = audioBlob.type || 'audio/webm';
      
      if (mimeType.includes('webm')) {
        extension = 'webm';
      } else if (mimeType.includes('ogg')) {
        extension = 'ogg';
      } else if (mimeType.includes('mp4')) {
        extension = 'm4a';
      } else if (mimeType.includes('wav')) {
        extension = 'wav';
      }
      
      // Clean sample name (remove invalid file name characters)
      const cleanName = sampleName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${cleanName}.${extension}`;
      
      const file = new File([audioBlob], fileName, { type: mimeType });
      await samplesApi.uploadSample({
        sample_name: sampleName,
        upload_type: 'recorded',
        file,
      });
      await fetchSamples();
      removePlaceholder(tempId);
    } catch (err: any) {
      console.error("Recording upload failed:", err);
      markPlaceholderFailed(tempId);
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this voice sample?")) {
      return;
    }
    
    // If this is a placeholder, remove immediately
    if (id.startsWith("temp-")) {
      removePlaceholder(id);
      return;
    }
    
    // Optimistically remove from UI
    const sampleToDelete = voiceSamples.find(s => s.id === id);
    setVoiceSamples(prev => prev.filter(s => s.id !== id));
    
    try {
      await samplesApi.deleteSample(parseInt(id));
      
      // Clear cache to ensure fresh data
      clearCache('/api/samples/');
      
      // Refresh the list to ensure consistency
      await fetchSamples();
      
      toast.success("Voice sample deleted successfully");
    } catch (err: any) {
      console.error("Delete failed:", err);
      // Restore the item if deletion failed
      if (sampleToDelete) {
        setVoiceSamples(prev => [...prev, sampleToDelete]);
      }
      toast.error(`Failed to delete sample: ${getErrorMessage(err)}`);
    }
  };

  return (
    <div className="flex flex-1 flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-background">
        <h1 className="text-2xl font-semibold transition-colors duration-500">
          My Voices
        </h1>
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section - Upload Voice Sample */}
        <section className="flex-1 p-6 border-b bg-muted/20 overflow-auto">
          <h2 className="text-lg font-medium mb-4 transition-colors duration-500">
            Upload Voice Sample
          </h2>
          
          <div className="max-w-4xl space-y-4">
            {/* Instructions */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-900/20 p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 transition-colors duration-500">
                <strong>Tip:</strong> Upload a 30-60 second sample of your voice for best results. 
                Speak clearly and naturally. Supported formats: MP3, WAV, M4A.
              </p>
            </div>

            {/* Upload Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Upload */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md p-6 shadow-md transition-all duration-500">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold transition-colors duration-500">
                        Upload File
                      </h3>
                      <p className="text-sm text-muted-foreground transition-colors duration-500">
                        Drag & drop or click to browse
                      </p>
                    </div>
                  </div>
                  <FileUploader onFile={handleFileUpload} />
                </div>
              </div>

              {/* Record Audio */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md p-6 shadow-md transition-all duration-500">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Mic className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold transition-colors duration-500">
                        Record Audio
                      </h3>
                      <p className="text-sm text-muted-foreground transition-colors duration-500">
                        Use your microphone
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsRecorderModalOpen(true)}
                    className="w-full transition-all duration-300"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Open Recorder
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Section - My Voice Samples */}
        <section className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium transition-colors duration-500">
              My Voice Samples
            </h2>
            <span className="text-sm text-muted-foreground transition-colors duration-500">
              {voiceSamples.length} {voiceSamples.length === 1 ? "sample" : "samples"}
            </span>
          </div>
          
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : voiceSamples.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voiceSamples.map((sample) => (
                <VoiceSampleCard
                  key={sample.id}
                  sample={sample}
                  onPlay={handlePlay}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground transition-colors duration-500">
                  No voice samples yet. Upload your first sample above!
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Recorder Modal */}
      <RecorderModal
        isOpen={isRecorderModalOpen}
        onClose={() => setIsRecorderModalOpen(false)}
        onRecorded={handleRecordingUpload}
      />

      {/* Audio Player Modal */}
      {playingSample && playingSample.audioUrl && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold transition-colors duration-500">
                {playingSample.name}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlayingSample(null)}
                className="transition-all duration-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AudioPlayer
              audioUrl={playingSample.audioUrl}
              title={playingSample.name}
              key={`play-${playingSample.id}`}
              onDownload={async () => {
                try {
                  const blob = await apiDownload(`/api/library/download/sample/${playingSample.id}`);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${playingSample.name || 'sample'}.wav`;
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

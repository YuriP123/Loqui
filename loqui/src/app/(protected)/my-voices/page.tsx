"use client";

import { useState, useEffect } from "react";
import FileUploader from "@/components/file-uploader";
import Recorder from "@/components/recorder";
import VoiceSampleCard, { type VoiceSample } from "@/components/voice-sample-card";
import { Upload, Mic, Loader2 } from "lucide-react";
import { samplesApi, getErrorMessage } from "@/lib/api";
import type { AudioSample } from "@/types/api";
import { toast } from "sonner";

// Helper function to format duration
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'week' : 'weeks'} ago`;
  return date.toLocaleDateString();
}

// Convert API AudioSample to VoiceSample format
function convertToVoiceSample(sample: AudioSample): VoiceSample {
  return {
    id: sample.sample_id.toString(),
    name: sample.sample_name,
    duration: formatDuration(sample.duration_seconds),
    uploadDate: formatDate(sample.uploaded_at),
    status: "ready", // Samples are always ready once uploaded
  };
}

export default function MyVoicesPage() {
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Fetch samples on mount
  useEffect(() => {
    fetchSamples();
  }, []);

  async function fetchSamples() {
    try {
      setIsLoading(true);
      const response = await samplesApi.list();
      const samples = response.samples.map(convertToVoiceSample);
      setVoiceSamples(samples);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error("Failed to load samples: " + message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    try {
      setIsUploading(true);
      
      // Generate a sample name from filename
      const sampleName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      
      // Upload to backend
      await samplesApi.upload({
        sample_name: sampleName,
        upload_type: "uploaded",
        file: file,
      });
      
      toast.success("Sample uploaded successfully!");
      
      // Refresh the list
      await fetchSamples();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error("Failed to upload: " + message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRecordingSaved(audioBlob: Blob) {
    try {
      setIsRecording(true);
      
      // Convert blob to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File([audioBlob], `recording-${timestamp}.wav`, { type: 'audio/wav' });
      
      // Upload to backend
      await samplesApi.upload({
        sample_name: `Recording ${new Date().toLocaleDateString()}`,
        upload_type: "recorded",
        file: file,
      });
      
      toast.success("Recording saved successfully!");
      
      // Refresh the list
      await fetchSamples();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error("Failed to save recording: " + message);
    } finally {
      setIsRecording(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this voice sample?")) {
      return;
    }
    
    try {
      await samplesApi.delete(parseInt(id));
      toast.success("Sample deleted successfully!");
      
      // Remove from local state
      setVoiceSamples(samples => samples.filter(s => s.id !== id));
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error("Failed to delete: " + message);
    }
  }

  function handlePlay(_id: string) {
    // TODO: Implement audio playback
    // For now, just show a message
    toast.info("Audio playback will be implemented in Phase 5");
  }

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
                  <FileUploader 
                    onFile={handleFileUpload} 
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
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
                  <Recorder 
                    onRecorded={handleRecordingSaved}
                    disabled={isRecording}
                  />
                  {isRecording && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving recording...</span>
                    </div>
                  )}
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
          
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground transition-colors duration-500">
                  Loading your voice samples...
                </p>
              </div>
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
    </div>
  );
}

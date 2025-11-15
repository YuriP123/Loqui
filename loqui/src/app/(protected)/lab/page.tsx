"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import GenerationWizard, { type WizardStep } from "@/components/generation-wizard";
import VoiceSampleCard, { type VoiceSample } from "@/components/voice-sample-card";
import AudioPlayer from "@/components/audio-player";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Search, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import * as samplesApi from "@/lib/api/samples";
import * as generationApi from "@/lib/api/generation";
import type { AudioSample, GeneratedAudio, AudioSampleListResponse } from "@/lib/api-types";
import { API_BASE_URL, apiDownload } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

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
    status: "ready",
    audioUrl: `${API_BASE_URL}/api/library/download/sample/${sample.sample_id}`,
  };
}

export default function LabPage() {
  const router = useRouter();
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [script, setScript] = useState("");
  const [title, setTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load voice samples on mount
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const resp = await samplesApi.listSamples();
        const samples = (resp as AudioSampleListResponse).samples ?? [];
        setVoiceSamples(samples.map(convertToVoiceSample));
      } catch (error) {
        console.error("Failed to load voice samples:", error);
      } finally {
        setLoadingSamples(false);
      }
    };
    fetchSamples();
  }, []);

  // Filter samples by search query
  const filteredSamples = voiceSamples.filter(sample =>
    sample.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const steps: WizardStep[] = [
    {
      id: "select-voice",
      title: "Select Voice Sample",
      description: "Choose a voice sample to use for your generation",
      content: (
        <div className="space-y-4">
          {voiceSamples.length > 0 ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search voice samples..."
                  className="pl-10 transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {loadingSamples ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredSamples.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSamples.map((sample) => (
                    <VoiceSampleCard
                      key={sample.id}
                      sample={sample}
                      selectable
                      selected={selectedVoice === sample.id}
                      onSelect={setSelectedVoice}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? "No samples match your search" : "No voice samples found"}
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground transition-colors duration-500">
                  No voice samples available.
                </p>
                <Link href="/my-voices">
                  <Button variant="outline" className="transition-all duration-300">
                    Upload Voice Sample
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      ),
      onNext: () => {
        if (!selectedVoice) {
          toast.error("Please select a voice sample");
          return false;
        }
        return true;
      },
    },
    {
      id: "enter-script",
      title: "Enter Script",
      description: "Type or paste the text you want to convert to speech",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 transition-colors duration-500">
              Generation Title
            </label>
            <Input
              placeholder="e.g., Welcome Message"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="transition-all duration-300"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium transition-colors duration-500">
                Script
              </label>
              <span className="text-xs text-muted-foreground transition-colors duration-500">
                {script.length} characters / {script.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <Textarea
              placeholder="Enter your script here..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={12}
              className="resize-none transition-all duration-300"
            />
          </div>

          <details className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 p-4 transition-all duration-500">
            <summary className="cursor-pointer font-medium transition-colors duration-500">
              Sample Scripts
            </summary>
            <div className="mt-3 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setScript(
                    "Welcome to Loqui! This is your AI-powered voice generation platform. Upload your voice sample, enter your script, and let AI create natural-sounding narrations."
                  )
                }
                className="w-full justify-start text-left transition-all duration-300"
              >
                Welcome Message
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setScript(
                    "Thank you for choosing our services. We're committed to providing you with the best experience possible. If you have any questions, please don't hesitate to reach out."
                  )
                }
                className="w-full justify-start text-left transition-all duration-300"
              >
                Thank You Message
              </Button>
            </div>
          </details>
        </div>
      ),
      onNext: () => {
        if (!script.trim()) {
          toast.error("Please enter a script");
          return false;
        }
        return true;
      },
    },
    {
      id: "review",
      title: "Review & Settings",
      description: "Review your selection and adjust settings if needed",
      content: (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md p-4 transition-all duration-500">
            <h3 className="font-semibold mb-3 transition-colors duration-500">
              Review
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground transition-colors duration-500">
                  Title:
                </span>
                <span className="ml-2 font-medium transition-colors duration-500">
                  {title || "Untitled"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground transition-colors duration-500">
                  Voice Sample:
                </span>
                <span className="ml-2 font-medium transition-colors duration-500">
                  {voiceSamples.find((v) => v.id === selectedVoice)?.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground transition-colors duration-500">
                  Script Length:
                </span>
                <span className="ml-2 font-medium transition-colors duration-500">
                  {script.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md p-4 transition-all duration-500">
            <h3 className="font-semibold mb-3 transition-colors duration-500">
              Script Preview
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap transition-colors duration-500">
              {script}
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-900/20 p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 transition-colors duration-500">
              <strong>Note:</strong> Advanced settings like speed and pitch adjustments will be available in a future update.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "generate",
      title: "Generate",
      description: isGenerating
        ? generationStatus || "Generating your AI voice..."
        : generationComplete
        ? "Generation complete!"
        : "Ready to generate your AI voice",
      content: (
        <div className="space-y-6">
          {!isGenerating && !generationComplete && (
            <div className="text-center py-12">
              <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 transition-colors duration-500">
                Ready to Generate
              </h3>
              <p className="text-muted-foreground transition-colors duration-500">
                Click "Complete" to start generating your AI voice
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 transition-colors duration-500">
                {generationStatus || "Generating..."}
              </h3>
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground transition-colors duration-500">
                  {generationProgress}% complete
                </p>
              </div>
              <p className="text-muted-foreground transition-colors duration-500">
                This may take a few moments. Please don't close this page.
              </p>
            </div>
          )}

          {generationComplete && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 transition-colors duration-500">
                  Generation Complete!
                </h3>
                <p className="text-muted-foreground transition-colors duration-500">
                  Your AI voice generation is ready
                </p>
              </div>

              {generatedAudio && generatedAudio.output_file_path && (() => {
                const audioUrl = `${API_BASE_URL}/api/library/download/generated/${generatedAudio.audio_id}`;
                console.log("Lab: Rendering AudioPlayer with URL:", audioUrl, "for audio_id:", generatedAudio.audio_id, "output_file_path:", generatedAudio.output_file_path);
                return (
                  <AudioPlayer
                    audioUrl={audioUrl}
                    title={title || "Generated Audio"}
                    key={`generated-${generatedAudio.audio_id}`}
                  onDownload={async () => {
                    try {
                      const blob = await apiDownload(`/api/library/download/generated/${generatedAudio.audio_id}`);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${generatedAudio.model_name || 'generated'}.wav`;
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
                );
              })()}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/generations")}
                  className="flex-1 transition-all duration-300"
                >
                  View All Generations
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1 transition-all duration-300"
                >
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleComplete = async () => {
    if (!selectedVoice) {
      toast.error("Please select a voice sample");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Starting generation...");
    
    try {
      // Create generation request
      const generation = await generationApi.createGeneration({
        sample_id: parseInt(selectedVoice),
        model_name: title || "Generated Voice",
        script_text: script,
      });

      setGeneratedAudio(generation);
      toast.success("Generation started! Processing your voice...");

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 100; // 5 minutes at 3s intervals
      
      pollIntervalRef.current = setInterval(async () => {
        try {
          attempts++;
          const status = await generationApi.getGenerationStatus(generation.audio_id);
          
          // Update progress and status
          if (status.progress !== undefined) {
            setGenerationProgress(status.progress);
          }
          if (status.message) {
            setGenerationStatus(status.message);
          } else if (status.status === 'pending') {
            setGenerationStatus("Queued for processing...");
            setGenerationProgress(10);
          } else if (status.status === 'processing') {
            setGenerationStatus("Processing audio...");
            setGenerationProgress(Math.min(90, 20 + (attempts * 2)));
          }
          
          if (status.status === 'completed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            setGenerationProgress(100);
            setGenerationStatus("Completed!");
            
            // Fetch full generation data
            const completedGeneration = await generationApi.getGeneration(generation.audio_id);
            console.log("Lab: Generation completed, setting generatedAudio:", {
              audio_id: completedGeneration.audio_id,
              output_file_path: completedGeneration.output_file_path,
              status: completedGeneration.status
            });
            setGeneratedAudio(completedGeneration);
            setIsGenerating(false);
            setGenerationComplete(true);
            toast.success("Generation completed successfully!");
          } else if (status.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            
            setIsGenerating(false);
            const errorMsg = status.message || "Generation failed";
            toast.error(errorMsg);
          }

          // Timeout after max attempts
          if (attempts >= maxAttempts) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setIsGenerating(false);
            toast.error("Generation timed out. Please check your generations page.");
          }
        } catch (error) {
          console.error("Error polling status:", error);
          // Don't stop polling on transient errors, but log them
          if (attempts >= 10) {
            // After 10 failed attempts, give up
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setIsGenerating(false);
            toast.error("Failed to check generation status. Please check your generations page.");
          }
        }
      }, 3000); // Poll every 3 seconds

      // Timeout after 5 minutes
      timeoutRef.current = setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (isGenerating) {
          setIsGenerating(false);
          toast.error("Generation timed out. Please check your generations page.");
        }
      }, 300000);

    } catch (error: any) {
      console.error("Generation failed:", error);
      setIsGenerating(false);
      const errorMsg = getErrorMessage(error);
      toast.error(`Failed to start generation: ${errorMsg}`);
    }
  };

  return (
    <div className="flex flex-1 flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-background">
        <h1 className="text-2xl font-semibold transition-colors duration-500">Lab</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden">
        <div className="h-full rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md p-6 shadow-md transition-all duration-500">
          <GenerationWizard
            steps={steps}
            onComplete={handleComplete}
            onCancel={() => router.push("/home")}
          />
        </div>
      </main>
    </div>
  );
}

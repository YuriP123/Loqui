"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GenerationWizard, { type WizardStep } from "@/components/generation-wizard";
import VoiceSampleCard, { type VoiceSample } from "@/components/voice-sample-card";
import AudioPlayer from "@/components/audio-player";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Search, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function LabPage() {
  const router = useRouter();
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [script, setScript] = useState("");
  const [title, setTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);

  // Mock voice samples
  const voiceSamples: VoiceSample[] = [
    {
      id: "1",
      name: "My Voice Sample 1",
      duration: "1:23",
      uploadDate: "2 days ago",
      status: "ready",
    },
    {
      id: "2",
      name: "Professional Voice",
      duration: "0:45",
      uploadDate: "1 week ago",
      status: "ready",
    },
  ];

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
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {voiceSamples.map((sample) => (
                  <VoiceSampleCard
                    key={sample.id}
                    sample={sample}
                    selectable
                    selected={selectedVoice === sample.id}
                    onSelect={setSelectedVoice}
                  />
                ))}
              </div>
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
          alert("Please select a voice sample");
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
          alert("Please enter a script");
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
        ? "Generating your AI voice..."
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
            <div className="text-center py-12">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 transition-colors duration-500">
                Generating...
              </h3>
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

              <AudioPlayer
                audioUrl="/demo-audio.mp3"
                title={title || "Generated Audio"}
                onDownload={() => console.log("Download")}
              />

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

  const handleComplete = async () => {
    setIsGenerating(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    setIsGenerating(false);
    setGenerationComplete(true);
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

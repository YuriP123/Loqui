"use client";

import { useState } from "react";
import FileUploader from "@/components/file-uploader";
import Recorder from "@/components/recorder";
import VoiceSampleCard, { type VoiceSample } from "@/components/voice-sample-card";
import { Upload, Mic } from "lucide-react";

export default function MyVoicesPage() {
  // Mock data - replace with actual data from backend
  const [voiceSamples] = useState<VoiceSample[]>([
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
    {
      id: "3",
      name: "Processing Sample",
      duration: "2:15",
      uploadDate: "Just now",
      status: "processing",
    },
  ]);

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
                  <FileUploader onFile={() => console.log("File uploaded")} />
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
                  <Recorder onRecorded={() => console.log("Recording saved")} />
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
          
          {voiceSamples.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voiceSamples.map((sample) => (
                <VoiceSampleCard
                  key={sample.id}
                  sample={sample}
                  onPlay={(id) => console.log("Play", id)}
                  onDelete={(id) => console.log("Delete", id)}
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

"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircularParticles } from "@/components/circular-particles";

type RecorderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRecorded: (blob: Blob, sampleName: string) => Promise<void>;
};

export default function RecorderModal({
  isOpen,
  onClose,
  onRecorded,
}: RecorderModalProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleName, setSampleName] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Analyze audio levels
  useEffect(() => {
    if (!recording || !analyserRef.current) return;

    const analyzeAudio = () => {
      if (!analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const normalizedLevel = Math.min(average / 255, 1); // Normalize to 0-1
      setAudioLevel(normalizedLevel);

      if (recording) {
        requestAnimationFrame(analyzeAudio);
      }
    };

    analyzeAudio();
  }, [recording]);

  async function startRecording() {
    setError(null);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Microphone access is not supported in this browser.");
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Determine the best mimeType supported by the browser
      let mimeType = "audio/webm";
      const options: MediaRecorderOptions = {};
      
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
        options.mimeType = mimeType;
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
        options.mimeType = mimeType;
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
        options.mimeType = mimeType;
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
        options.mimeType = mimeType;
      }
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        const actualMimeType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        
        if (!sampleName.trim()) {
          chunksRef.current = [];
          setError("Please enter a name for your recording");
          return;
        }

        setUploading(true);
        try {
          await onRecorded(blob, sampleName.trim());
          setSampleName("");
          setAudioLevel(0);
          onClose();
        } catch (error: any) {
          console.error("Recording upload error:", error);
          setError(error.message || "Upload failed. Please try again.");
        } finally {
          setUploading(false);
          chunksRef.current = [];
        }
      };
      
      recorder.onerror = (event: any) => {
        console.error("MediaRecorder error:", event);
        setError("Recording error occurred. Please try again.");
        setRecording(false);
      };
      
      recorder.start(100);
      setRecording(true);
    } catch (e: any) {
      console.error("Failed to start recording:", e);
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setError(
          "Microphone access denied. Please allow microphone access and try again."
        );
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        setError("No microphone found. Please connect a microphone and try again.");
      } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
        setError("Microphone is already in use by another application.");
      } else {
        setError(`Failed to start recording: ${e.message || "Please check your microphone."}`);
      }
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setRecording(false);
    setAudioLevel(0);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={recording || uploading}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold transition-colors duration-500">
            Record Voice Sample
          </h2>
          <p className="text-sm text-muted-foreground mt-1 transition-colors duration-500">
            {recording ? "Recording in progress..." : "Enter a name and start recording"}
          </p>
        </div>

        {/* Particle Canvas */}
        <CircularParticles audioLevel={audioLevel} height="h-64" />

        {/* Sample Name Input */}
        <div>
          <label className="block text-sm font-medium mb-2 transition-colors duration-500">
            Sample Name
          </label>
          <Input
            value={sampleName}
            onChange={(e) => setSampleName(e.target.value)}
            placeholder="e.g., My Voice Sample"
            disabled={recording || uploading}
            className="transition-all duration-300"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          <Button
            onClick={recording ? stopRecording : startRecording}
            disabled={uploading || (!recording && !sampleName.trim())}
            className={`flex-1 transition-all duration-300 ${
              uploading
                ? "bg-gray-400 cursor-not-allowed"
                : recording 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {uploading ? "⏳ Uploading..." : recording ? "⏹ Stop Recording" : "🎙️ Start Recording"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={recording || uploading}
            className="transition-all duration-300"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}


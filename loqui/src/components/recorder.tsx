"use client";

import { useEffect, useRef, useState } from "react";

export default function Recorder({
  onRecorded,
}: {
  onRecorded: (blob: Blob, sampleName: string) => Promise<void>;
}) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check microphone permission status on mount
    const checkPermission = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (result.state === 'denied') {
            setError("Microphone access is blocked. Please enable it in your browser settings.");
          }
          // Listen for permission changes
          result.onchange = () => {
            if (result.state === 'granted') {
              setError(null);
            } else if (result.state === 'denied') {
              setError("Microphone access is blocked. Please enable it in your browser settings.");
            }
          };
        } catch (e) {
          // Permissions API not fully supported, ignore
        }
      }
    };
    
    checkPermission();
    
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError(null);
    setSuccess(false);
    
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Microphone access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.");
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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
        // Use the actual mimeType from the recorder
        const actualMimeType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        
        // Get sample name from user
        const sampleName = prompt("Enter a name for this recording:", `Recording ${new Date().toLocaleString()}`);
        if (!sampleName) {
          // User cancelled, clean up
          chunksRef.current = [];
          return;
        }

        setUploading(true);
        try {
          await onRecorded(blob, sampleName);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } catch (error: any) {
          console.error("Recording upload error:", error);
          setError(error.message || "Upload failed. Please try again.");
          setTimeout(() => setError(null), 5000);
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
      
      recorder.start(100); // Collect data every 100ms
      setRecording(true);
    } catch (e: any) {
      console.error("Failed to start recording:", e);
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setError(
          "Microphone access denied. " +
          "Please click the lock icon in your browser's address bar and allow microphone access, " +
          "or go to your browser settings to enable microphone permissions for this site, then try again."
        );
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        setError("No microphone found. Please connect a microphone and try again.");
      } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
        setError("Microphone is already in use by another application. Please close other apps using the microphone and try again.");
      } else {
        setError(`Failed to start recording: ${e.message || "Please check your microphone and try again."}`);
      }
    }
  }

  function stop() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }

  return (
    <div className="space-y-3">
      <button
        onClick={recording ? stop : start}
        disabled={uploading}
        className={`w-full rounded-md px-4 py-3 text-white font-medium transition-all duration-300 ${
          uploading
            ? "bg-gray-400 cursor-not-allowed"
            : recording 
            ? "bg-red-600 hover:bg-red-700 animate-pulse" 
            : "bg-primary hover:bg-primary/90"
        }`}
      >
        {uploading ? "⏳ Uploading..." : recording ? "⏹ Stop & Save Recording" : "🎙️ Start Recording"}
      </button>
      {recording && (
        <p className="text-sm text-center text-muted-foreground animate-pulse transition-colors duration-500">
          Recording in progress...
        </p>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/80 dark:bg-green-900/20 p-3">
          <p className="text-sm text-green-800 dark:text-green-200">✓ Recording saved successfully!</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}



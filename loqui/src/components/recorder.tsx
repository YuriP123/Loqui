"use client";

import { useEffect, useRef, useState } from "react";

export default function Recorder({
  onRecorded,
  disabled = false,
}: {
  onRecorded: (blob: Blob) => void;
  disabled?: boolean;
}) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      setChunks([]);
      recorder.ondataavailable = (e) => setChunks((prev) => [...prev, e.data]);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        onRecorded(blob);
      };
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied or not available.");
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
        disabled={disabled}
        className={`w-full rounded-md px-4 py-3 text-white font-medium transition-all duration-300 ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : recording 
            ? "bg-red-600 hover:bg-red-700 animate-pulse" 
            : "bg-primary hover:bg-primary/90"
        }`}
      >
        {recording ? "⏹ Stop & Save Recording" : "🎙️ Start Recording"}
      </button>
      {recording && (
        <p className="text-sm text-center text-muted-foreground animate-pulse transition-colors duration-500">
          Recording in progress...
        </p>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}



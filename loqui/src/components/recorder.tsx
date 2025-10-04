"use client";

import { useEffect, useRef, useState } from "react";

export default function Recorder({
  onRecorded,
}: {
  onRecorded: (blob: Blob) => void;
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
    } catch (e) {
      setError("Microphone access denied or not available.");
    }
  }

  function stop() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={recording ? stop : start}
        className={`rounded-md px-4 py-2 text-white ${
          recording ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"
        }`}
      >
        {recording ? "Stop & Save Recording" : "Start Recording"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}



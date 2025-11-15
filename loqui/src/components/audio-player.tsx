"use client";

import { Play, Pause, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { getAuthToken } from "@/lib/api-client";
import { CircularParticles } from "@/components/circular-particles";

type AudioPlayerProps = {
  audioUrl: string;
  title?: string;
  onDownload?: () => void;
  showParticles?: boolean;
};

export default function AudioPlayer({
  audioUrl,
  title,
  onDownload,
  showParticles = true,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Fetch audio with authentication and create blob URL
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        setLoading(true);
        setError("");
        setBlobUrl(""); // Clear previous blob URL immediately
        setCurrentTime(0);
        setIsPlaying(false);

        // Cleanup previous blob URL if it exists
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }

        console.log("AudioPlayer: Fetching audio from:", audioUrl);

        const token = getAuthToken();
        if (!token) {
          throw new Error("Not authenticated. Please login again.");
        }

        // Add cache-busting query parameter to ensure fresh fetch
        const urlWithCacheBust = `${audioUrl}?t=${Date.now()}`;
        const headers: HeadersInit = {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        };

        const response = await fetch(urlWithCacheBust, { headers });
        
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        
        if (!response.ok) {
          throw new Error(`Failed to load audio: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log("AudioPlayer: Received blob, size:", blob.size, "type:", blob.type);
        const objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;
        setBlobUrl(objectUrl);
        setLoading(false);
      } catch (err: any) {
        console.error("Audio fetch error:", err);
        setError(err.message || "Failed to load audio");
        setLoading(false);
      }
    };

    if (audioUrl) {
      fetchAudio();
    }

    // Cleanup: revoke the blob URL when component unmounts or audioUrl changes
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setBlobUrl("");
    };
  }, [audioUrl]);

  // Set up audio analysis for playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !blobUrl) return;

    // Cleanup previous audio context and source
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
      audioContextRef.current = null;
    }

    // Set up Web Audio API for analysis
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      // Only create source if audio element is ready
      if (audio.readyState >= 1) {
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;
      } else {
        // Wait for audio to be ready
        const handleCanPlay = () => {
          if (!audioContext || !analyser || sourceRef.current) return;
          
          try {
            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            sourceRef.current = source;
          } catch (err) {
            console.warn("Failed to set up audio analysis:", err);
          }
        };
        
        audio.addEventListener('canplay', handleCanPlay, { once: true });
        
        // Store references for the callback
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        return () => {
          audio.removeEventListener('canplay', handleCanPlay);
        };
      }
    } catch (err) {
      console.warn("Failed to set up audio analysis:", err);
    }

    // Pause and reset audio completely when blob URL changes
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    
    // Force reload by clearing src first, then setting new one
    const currentSrc = audio.src;
    if (currentSrc && currentSrc !== blobUrl) {
      // Clear the old source
      audio.src = "";
      audio.load();
    }
    
    // Set the new source
    audio.src = blobUrl;
    audio.load();
    console.log("AudioPlayer: Set new audio src:", blobUrl, "Previous:", currentSrc);

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setAudioLevel(0);
    };
    const handleError = () => {
      setError("Failed to play audio");
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      
      // Cleanup audio source
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        sourceRef.current = null;
      }
      
      // Cleanup audio context
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Ignore close errors
        }
        audioContextRef.current = null;
      }
      
      analyserRef.current = null;
    };
  }, [blobUrl]);

  // Analyze audio levels during playback
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) {
      setAudioLevel(0);
      return;
    }

    const analyzeAudio = () => {
      if (!analyserRef.current || !isPlaying) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const normalizedLevel = Math.min(average / 255, 1); // Normalize to 0-1
      setAudioLevel(normalizedLevel);

      if (isPlaying) {
        requestAnimationFrame(analyzeAudio);
      }
    };

    analyzeAudio();
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md p-4 shadow-md transition-all duration-500">
      {blobUrl && <audio key={blobUrl} ref={audioRef} src={blobUrl} preload="metadata" crossOrigin="anonymous" />}

      {title && (
        <h4 className="font-medium mb-3 transition-colors duration-500">
          {title}
        </h4>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 p-3 mb-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading audio...</span>
        </div>
      )}

      {/* Particle Visualization */}
      {showParticles && !loading && !error && (
        <div className="mb-4">
          <CircularParticles audioLevel={audioLevel} height="h-48" />
        </div>
      )}

      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary transition-colors duration-500"
          />
          <div className="flex justify-between text-xs text-muted-foreground transition-colors duration-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        {!loading && !error && (
          <div className="flex items-center gap-2">
            <Button
              onClick={togglePlay}
              size="sm"
              className="transition-all duration-300"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 mr-1" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            {onDownload && (
              <Button
                onClick={onDownload}
                size="sm"
                variant="outline"
                className="ml-auto transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


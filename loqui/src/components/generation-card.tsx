"use client";

import { Play, Download, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type GenerationItem = {
  id: string;
  title: string;
  voiceSample: string;
  scriptPreview: string;
  duration: string;
  generatedDate: string;
  status: "completed" | "processing" | "failed";
  audioUrl?: string;
};

type GenerationCardProps = {
  item: GenerationItem;
  onPlay?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRegenerate?: (id: string) => void;
};

export default function GenerationCard({
  item,
  onPlay,
  onDownload,
  onDelete,
  onRegenerate,
}: GenerationCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md p-4 shadow-md transition-all duration-500 hover:shadow-lg">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate transition-colors duration-500">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground transition-colors duration-500">
              Voice: {item.voiceSample}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full transition-colors duration-500 ${
              item.status === "completed"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                : item.status === "processing"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            }`}
          >
            {item.status}
          </span>
        </div>

        {/* Script Preview */}
        <p className="text-sm text-muted-foreground line-clamp-2 transition-colors duration-500">
          {item.scriptPreview}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground transition-colors duration-500">
          <span>{item.duration}</span>
          <span>•</span>
          <span>{item.generatedDate}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {item.status === "completed" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPlay?.(item.id)}
                className="transition-all duration-300"
              >
                <Play className="h-4 w-4 mr-1" />
                Play
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload?.(item.id)}
                className="transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </>
          )}
          {item.status === "failed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRegenerate?.(item.id)}
              className="transition-all duration-300"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete?.(item.id)}
            className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


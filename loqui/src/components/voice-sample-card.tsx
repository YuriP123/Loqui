"use client";

import { Play, Trash2, Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type VoiceSample = {
  id: string;
  name: string;
  duration: string;
  uploadDate: string;
  status: "ready" | "processing" | "failed";
  audioUrl?: string;
};

type VoiceSampleCardProps = {
  sample: VoiceSample;
  onPlay?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onSelect?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
};

export default function VoiceSampleCard({
  sample,
  onPlay,
  onDelete,
  onSelect,
  selectable = false,
  selected = false,
}: VoiceSampleCardProps) {
  return (
    <div
      className={`rounded-lg border bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md p-4 shadow-md transition-all duration-500 hover:shadow-lg ${
        selectable ? "cursor-pointer hover:border-primary" : ""
      } ${
        selected
          ? "border-primary bg-primary/5"
          : "border-gray-200 dark:border-gray-800"
      }`}
      onClick={() => selectable && onSelect?.(sample.id)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate transition-colors duration-500">
              {sample.name}
            </h3>
            <p className="text-sm text-muted-foreground transition-colors duration-500">
              {sample.duration}
            </p>
          </div>
          {selected && selectable && (
            <div className="rounded-full bg-primary p-1">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Status & Date */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full transition-colors duration-500 ${
              sample.status === "ready"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                : sample.status === "processing"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            }`}
          >
            {sample.status}
          </span>
          <span className="text-xs text-muted-foreground transition-colors duration-500">
            {sample.uploadDate}
          </span>
        </div>

        {/* Actions */}
        {!selectable && sample.status === "ready" && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.(sample.id);
              }}
              className="transition-all duration-300"
            >
              <Play className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(sample.id);
              }}
              className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


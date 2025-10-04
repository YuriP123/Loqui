"use client";

import { AudioItem } from "@/lib/storage";

export default function SampleList({
  items,
  selectedId,
  onSelect,
  onDelete,
}: {
  items: AudioItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <ul className="divide-y rounded-md border">
      {items.length === 0 && (
        <li className="p-4 text-sm text-muted-foreground">No samples yet.</li>
      )}
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between p-3">
          <button
            className={`text-left ${
              selectedId === item.id ? "font-semibold" : ""
            }`}
            onClick={() => onSelect?.(item.id)}
          >
            {item.name}
          </button>
          <div className="flex items-center gap-2">
            <audio controls src={item.dataUrl} className="h-8" />
            {onDelete && (
              <button
                className="rounded-md border px-2 py-1 text-sm hover:bg-muted"
                onClick={() => onDelete(item.id)}
              >
                Delete
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}



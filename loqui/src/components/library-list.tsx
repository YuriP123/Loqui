"use client";

import { AudioItem } from "@/lib/storage";

export default function LibraryList({
  items,
  onDelete,
}: {
  items: AudioItem[];
  onDelete?: (id: string) => void;
}) {
  return (
    <ul className="divide-y rounded-md border">
      {items.length === 0 && (
        <li className="p-4 text-sm text-muted-foreground">No items found.</li>
      )}
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between p-3">
          <div>
            <div className="text-sm font-medium">{item.name}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(item.createdAt).toLocaleString()} • {item.type}
            </div>
          </div>
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



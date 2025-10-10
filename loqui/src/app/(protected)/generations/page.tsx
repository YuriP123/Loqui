"use client";

import { useState } from "react";
import GenerationCard, { type GenerationItem } from "@/components/generation-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Trash2 } from "lucide-react";

export default function GenerationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Mock data - replace with actual data from backend
  const generations: GenerationItem[] = [
    {
      id: "1",
      title: "Welcome Message",
      voiceSample: "My Voice Sample 1",
      scriptPreview: "Welcome to Loqui! This is your AI-powered voice generation platform...",
      duration: "0:45",
      generatedDate: "2 hours ago",
      status: "completed",
    },
    {
      id: "2",
      title: "Product Demo Script",
      voiceSample: "Professional Voice",
      scriptPreview: "In this demo, we'll show you how our revolutionary product works...",
      duration: "2:15",
      generatedDate: "1 day ago",
      status: "completed",
    },
    {
      id: "3",
      title: "Tutorial Narration",
      voiceSample: "My Voice Sample 1",
      scriptPreview: "Step one: Open the application. Step two: Navigate to the settings...",
      duration: "3:30",
      generatedDate: "3 days ago",
      status: "completed",
    },
    {
      id: "4",
      title: "Processing Audio",
      voiceSample: "Professional Voice",
      scriptPreview: "This generation is currently being processed...",
      duration: "1:20",
      generatedDate: "Just now",
      status: "processing",
    },
    {
      id: "5",
      title: "Failed Generation",
      voiceSample: "My Voice Sample 1",
      scriptPreview: "This generation encountered an error and needs to be retried...",
      duration: "0:00",
      generatedDate: "5 days ago",
      status: "failed",
    },
  ];

  const filteredGenerations = generations.filter((gen) =>
    gen.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gen.scriptPreview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gen.voiceSample.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDownload = () => {
    console.log("Bulk download:", selectedItems);
    alert("Downloading selected items...");
  };

  const handleBulkDelete = () => {
    console.log("Bulk delete:", selectedItems);
    if (confirm(`Delete ${selectedItems.length} selected items?`)) {
      setSelectedItems([]);
      alert("Items deleted");
    }
  };

  return (
    <div className="flex flex-1 flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold transition-colors duration-500">
            Generations
          </h1>
          <div className="text-sm text-muted-foreground transition-colors duration-500">
            {generations.length} {generations.length === 1 ? "generation" : "generations"}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden p-6">
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search generations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-all duration-300"
              />
            </div>
            <Button variant="outline" className="transition-all duration-300">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="rounded-lg border border-primary bg-primary/5 p-3 flex items-center justify-between transition-all duration-500">
              <span className="text-sm font-medium transition-colors duration-500">
                {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDownload}
                  className="transition-all duration-300"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedItems([])}
                  className="transition-all duration-300"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Generations List */}
          <div className="flex-1 overflow-auto">
            {filteredGenerations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGenerations.map((item) => (
                  <div
                    key={item.id}
                    className={`relative ${
                      selectedItems.includes(item.id) ? "ring-2 ring-primary rounded-lg" : ""
                    }`}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                    <GenerationCard
                      item={item}
                      onPlay={(id) => console.log("Play", id)}
                      onDownload={(id) => console.log("Download", id)}
                      onDelete={(id) => console.log("Delete", id)}
                      onRegenerate={(id) => console.log("Regenerate", id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium transition-colors duration-500">
                    No generations found
                  </p>
                  <p className="text-muted-foreground transition-colors duration-500">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "Create your first generation in the Lab"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination Placeholder */}
          {filteredGenerations.length > 0 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" disabled className="transition-all duration-300">
                Previous
              </Button>
              <span className="text-sm text-muted-foreground transition-colors duration-500">
                Page 1 of 1
              </span>
              <Button variant="outline" size="sm" disabled className="transition-all duration-300">
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


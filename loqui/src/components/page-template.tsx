import { ReactNode } from "react";

interface PageTemplateProps {
  title: string;
  topSection: {
    title: string;
    content: ReactNode;
  };
  bottomSection: {
    title: string;
    content: ReactNode;
  };
  headerActions?: ReactNode;
}

export default function PageTemplate({
  title,
  topSection,
  bottomSection,
  headerActions,
}: PageTemplateProps) {
  return (
    <div className="flex flex-1 flex-col h-screen">
      {/* Header Section */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex items-center gap-4">
          {headerActions}
        </div>
      </header>
      
      {/* Main Content Area - Split into 2 horizontal sections */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section */}
        <section className="flex-1 p-6 border-b bg-muted/20">
          <div className="h-full">
            <h2 className="text-lg font-medium mb-4">{topSection.title}</h2>
            <div className="h-full bg-background rounded-lg border p-4">
              {topSection.content}
            </div>
          </div>
        </section>
        
        {/* Bottom Section */}
        <section className="flex-1 p-6">
          <div className="h-full">
            <h2 className="text-lg font-medium mb-4">{bottomSection.title}</h2>
            <div className="h-full bg-background rounded-lg border p-4">
              {bottomSection.content}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


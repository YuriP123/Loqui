import PageTemplate from "@/components/page-template";

export default function HomePage() {
  return (
    <PageTemplate
      title="Home"
      topSection={{
        title: "Section 1",
        content: (
          <p className="text-muted-foreground">
            This is the top section content area. You can add any content here.
          </p>
        ),
      }}
      bottomSection={{
        title: "Section 2",
        content: (
          <p className="text-muted-foreground">
            This is the bottom section content area. You can add any content here.
          </p>
        ),
      }}
    />
  );
}



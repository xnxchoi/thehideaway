import { PageClient } from "@/app/(frontend)/(dev)/dodo/page.client";

export default function DevPdfPage() {
  const timestamp = Date.now();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <PageClient />
      <div
        style={{
          padding: "1rem",
          borderBottom: "1px solid #ccc",
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <h1 style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
          🧾 PDF Preview{" "}
        </h1>
        <span style={{ fontSize: "0.875rem", color: "#666" }}>
          Reload this page to see updates
        </span>
      </div>
      <iframe
        src={`/api/dev?ts=${timestamp}`}
        style={{ flex: 1, width: "100%", border: "none" }}
      />
    </div>
  );
}

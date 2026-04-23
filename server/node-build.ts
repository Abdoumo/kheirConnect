import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const PORT = process.env.PORT || 9999;
const HOST = process.env.HOST || "0.0.0.0";


// In production, serve the built SPA files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.use((req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Fusion Starter server running on http://${HOST}:${PORT}`);
  console.log(`📱 Frontend: http://${HOST}:${PORT}`);
  console.log(`🔧 API: http://${HOST}:${PORT}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});

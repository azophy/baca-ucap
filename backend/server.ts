import { serve } from "bun";
import { join } from "path";

const PORT = process.env.PORT || 3000;

const server = serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // API endpoints
    if (path === "/api/transcribe" && req.method === "POST") {
      return new Response(
        JSON.stringify({
          error: "Not implemented yet"
        }),
        {
          status: 501,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Static file serving
    const publicDir = join(import.meta.dir, "..", "public");
    const frontendDir = join(import.meta.dir, "..", "frontend");

    // Try to serve from public directory first
    let filePath = join(publicDir, path === "/" ? "index.html" : path);
    let file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    // Fallback to frontend directory for development
    filePath = join(frontendDir, path === "/" ? "index.html" : path);
    file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    // 404 Not Found
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running on http://localhost:${PORT}`);

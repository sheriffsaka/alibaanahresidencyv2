import path from "path";
import express from "express";
import app from "./api/index.ts";

async function startStandaloneServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware in development; Static serving in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start standalone server if executed directly (e.g. tsx watch server.ts or node dist/server.cjs)
const isDirectRun = Boolean(
  process.argv[1] && (
    process.argv[1].endsWith("server.ts") ||
    process.argv[1].endsWith("server.cjs") ||
    process.argv[1].endsWith("server.js")
  )
);

if (isDirectRun && !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.LAMBDA_TASK_ROOT) {
  startStandaloneServer();
}

export default app;

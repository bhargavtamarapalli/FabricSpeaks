import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        console.error('⚠️ Vite transformation error (not fatal):', msg);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Let Vite handle ALL requests first (assets, HMR, etc.)
  app.use(vite.middlewares);
  
  // Catch-all for HTML pages (only if Vite didn't handle it)
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API requests
    if (url.startsWith('/api') || url.startsWith('/health')) {
      return next();
    }

    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
      
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      console.error('❌ Error serving HTML for', url, ':', e);
      vite.ssrFixStacktrace(e as Error);
      
      res.status(500).set({ "Content-Type": "text/html" }).end(`
        <!DOCTYPE html>
        <html>
          <head><title>Server Error</title></head>
          <body>
            <h1>Server Error</h1>
            <p>Failed to load the page. Please refresh.</p>
            <pre>${e instanceof Error ? e.message : String(e)}</pre>
          </body>
        </html>
      `);
    }
  });
}

export function serveStatic(app: Express) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use((_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

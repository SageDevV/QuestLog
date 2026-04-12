import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";

// In a PKG environment, local files packaged as assets are found in the /snapshot hierarchy.
// Because esbuild builds this script output to "dist/launcher.js", its __dirname is inside "dist/".
// Meanwhile, Vite generates static production bits directly to "dist/" (index.html, assets/..), 
// so placing them within assets config allows us to serve them cleanly with node FS methods.
const POSSIBLE_ROOTS = [
  path.join(__dirname), // If inside dist/
  path.join(__dirname, "dist"), // If invoked from project root manually
];

let SERVE_DIR = POSSIBLE_ROOTS[0];
for (const p of POSSIBLE_ROOTS) {
  if (fs.existsSync(path.join(p, "index.html"))) {
    SERVE_DIR = p;
    break;
  }
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/**
 * Serves static files directly from the packaged VFS.
 * Ensures the web app runs perfectly autonomously offline.
 */
const server = http.createServer((req, res) => {
  try {
    let urlPath = req.url === "/" ? "/index.html" : req.url;
    if (!urlPath) urlPath = "/index.html";

    // Clean Path to prevent transversal attacks if running outside PKG
    const safeSuffix = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = path.join(SERVE_DIR, safeSuffix);

    if (fs.existsSync(filePath)) {
      const extname = String(path.extname(filePath)).toLowerCase();
      const contentType = MIME_TYPES[extname] || "application/octet-stream";

      const content = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    } else {
      // Fallback for React/SPA routes
      const idxPath = path.join(SERVE_DIR, "index.html");
      if (fs.existsSync(idxPath)) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync(idxPath), "utf-8");
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found: Static build files not found in executable bundle.", "utf-8");
      }
    }
  } catch (err: any) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(`Internal Server Error: ${err.message}`, "utf-8");
  }
});

let serverProcess: http.Server | null = null;

export function openBrowser(url: string): Promise<void> {
  return new Promise((resolve) => {
    childProcess.exec(`start "" "${url}"`, (error) => {
      if (error) {
        console.error("-> Failed to trigger PC default browser automatically.");
        console.error(`-> To play, please open this URL manually: ${url}`);
      }
      resolve();
    });
  });
}

function setupLifecycleHandlers(): void {
  const shutdown = () => {
    console.log("\n[!] Shutting down Quest Log System...");
    if (serverProcess) {
      serverProcess.close();
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

export async function main(): Promise<void> {
  try {
    setupLifecycleHandlers();
    
    serverProcess = server.listen(14777, "127.0.0.1", async () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const url = `http://127.0.0.1:${address.port}/`;

        console.log("==========================================");
        console.log("  >>> QUEST LOG EXECUTABLE READY  <<< ");
        console.log("==========================================");
        console.log(`-> Local URL: ${url}`);
        console.log("-> Launching default browser...");
        console.log("-> Press Ctrl+C or close this console to quit.");
        console.log("==========================================");
        
        await openBrowser(url);
      }
    });

  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
       console.error(`[Fatal] O aplicativo já está aberto no fundo. Feche o QuestLog primeiramente e tente de novo!`);
    } else {
       console.error(`[Fatal] Exe initialization failed: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run only when executed directly via bin or CLI
const isDirectExecution = typeof require !== "undefined" && require.main === module;
if (isDirectExecution) {
  main();
}

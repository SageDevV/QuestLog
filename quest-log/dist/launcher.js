"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// launcher.ts
var launcher_exports = {};
__export(launcher_exports, {
  main: () => main,
  openBrowser: () => openBrowser
});
module.exports = __toCommonJS(launcher_exports);
var http = __toESM(require("http"), 1);
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var childProcess = __toESM(require("child_process"), 1);
var POSSIBLE_ROOTS = [
  path.join(__dirname),
  // If inside dist/
  path.join(__dirname, "dist")
  // If invoked from project root manually
];
var SERVE_DIR = POSSIBLE_ROOTS[0];
for (const p of POSSIBLE_ROOTS) {
  if (fs.existsSync(path.join(p, "index.html"))) {
    SERVE_DIR = p;
    break;
  }
}
var MIME_TYPES = {
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
  ".woff2": "font/woff2"
};
var server = http.createServer((req, res) => {
  try {
    let urlPath = req.url === "/" ? "/index.html" : req.url;
    if (!urlPath) urlPath = "/index.html";
    const safeSuffix = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
    const filePath = path.join(SERVE_DIR, safeSuffix);
    if (fs.existsSync(filePath)) {
      const extname2 = String(path.extname(filePath)).toLowerCase();
      const contentType = MIME_TYPES[extname2] || "application/octet-stream";
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    } else {
      const idxPath = path.join(SERVE_DIR, "index.html");
      if (fs.existsSync(idxPath)) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync(idxPath), "utf-8");
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found: Static build files not found in executable bundle.", "utf-8");
      }
    }
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(`Internal Server Error: ${err.message}`, "utf-8");
  }
});
var serverProcess = null;
function openBrowser(url) {
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
function setupLifecycleHandlers() {
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
async function main() {
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
  } catch (error) {
    if (error.code === "EADDRINUSE") {
      console.error(`[Fatal] O aplicativo j\xE1 est\xE1 aberto no fundo. Feche o QuestLog primeiramente e tente de novo!`);
    } else {
      console.error(`[Fatal] Exe initialization failed: ${error.message}`);
    }
    process.exit(1);
  }
}
var isDirectExecution = typeof require !== "undefined" && require.main === module;
if (isDirectExecution) {
  main();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main,
  openBrowser
});

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { transform } = require("sucrase");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const webRoot = path.join(repoRoot, "apps", "web");
const srcDir = path.join(webRoot, "src");
const publicDir = path.join(webRoot, "public");
const distDir = path.join(webRoot, "dist");
const assetsDir = path.join(distDir, "assets");
const tempDir = path.join(webRoot, ".fallback-build");
const buildVersion = Date.now().toString(36);

const fileEnv = await loadEnv(path.join(webRoot, ".env"));
const env = {
  ...fileEnv,
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith("VITE_"))),
};

await fs.rm(distDir, { recursive: true, force: true });
await fs.rm(tempDir, { recursive: true, force: true });
await fs.mkdir(assetsDir, { recursive: true });
await fs.mkdir(tempDir, { recursive: true });

await copyDirectory(publicDir, distDir);
await compileCss();
await compileSourceDirectory(srcDir, srcDir);
await writeIndexHtml();

console.log(`Fallback web build ready at ${distDir}`);

async function loadEnv(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .reduce((accumulator, line) => {
        const separatorIndex = line.indexOf("=");
        if (separatorIndex === -1) {
          return accumulator;
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        accumulator[key] = value;
        return accumulator;
      }, {});
  } catch {
    return {};
  }
}

async function copyDirectory(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
      continue;
    }

    await fs.copyFile(sourcePath, targetPath);
  }
}

async function compileCss() {
  const sourceCss = stripBom(await fs.readFile(path.join(srcDir, "index.css"), "utf8"));
  const normalizedCss = sourceCss.replace(
    '@import "leaflet/dist/leaflet.css";',
    '@import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");',
  );
  const inputPath = path.join(tempDir, "index.css");
  const outputPath = path.join(assetsDir, "index.css");

  await fs.writeFile(inputPath, normalizedCss, "utf8");

  await runCommand(process.execPath, [path.join(webRoot, "node_modules", "tailwindcss", "lib", "cli.js"), "-i", inputPath, "-o", outputPath, "--minify"], {
    cwd: webRoot,
  });
}

async function compileSourceDirectory(currentDir, rootDir) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      await compileSourceDirectory(sourcePath, rootDir);
      continue;
    }

    const relativePath = path.relative(rootDir, sourcePath);
    const extension = path.extname(entry.name);
    const outputRelativePath = extension === ".jsx" ? relativePath.replace(/\.jsx$/u, ".js") : relativePath;
    const outputPath = path.join(distDir, "src", outputRelativePath);
    const outputDir = path.dirname(outputPath);

    await fs.mkdir(outputDir, { recursive: true });

    if (extension === ".jsx" || extension === ".js") {
      const sourceCode = stripBom(await fs.readFile(sourcePath, "utf8"));
      const transformedCode = transformModule(sourceCode, extension);
      await fs.writeFile(outputPath, transformedCode, "utf8");
      continue;
    }

    await fs.copyFile(sourcePath, outputPath);
  }
}

function transformModule(sourceCode, extension) {
  let code = replaceEnvLiterals(sourceCode);
  code = code.replace(/^\s*import\s+["'][^"']+\.css["'];?\s*$/gmu, "");

  if (extension === ".jsx") {
    code = transform(code, {
      transforms: ["jsx"],
      jsxRuntime: "automatic",
      production: false,
    }).code;
  }

  return rewriteImportSpecifiers(code);
}

function replaceEnvLiterals(sourceCode) {
  return sourceCode
    .replaceAll("import.meta.env.DEV", "true")
    .replaceAll("import.meta.env.VITE_API_URL", JSON.stringify(env.VITE_API_URL || "http://localhost:4001"))
    .replaceAll(
      "import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY",
      JSON.stringify(env.VITE_GOOGLE_MAPS_EMBED_API_KEY || ""),
    )
    .replaceAll("import.meta.env.VITE_GOOGLE_MAPS_LANGUAGE", JSON.stringify(env.VITE_GOOGLE_MAPS_LANGUAGE || "ru"))
    .replaceAll("import.meta.env.VITE_GOOGLE_MAPS_REGION", JSON.stringify(env.VITE_GOOGLE_MAPS_REGION || "KG"));
}

function stripBom(sourceCode) {
  return sourceCode.replace(/^\uFEFF/u, "");
}

function rewriteImportSpecifiers(sourceCode) {
  const rewrite = (specifier) => {
    if (!specifier.startsWith(".")) {
      return specifier;
    }

    let rewritten = specifier;

    if (rewritten.endsWith(".jsx")) {
      rewritten = rewritten.replace(/\.jsx$/u, ".js");
    } else if (!path.extname(rewritten)) {
      rewritten = `${rewritten}.js`;
    }

    if (rewritten.endsWith(".css")) {
      return `${rewritten}?v=${buildVersion}`;
    }

    if (path.extname(rewritten)) {
      return `${rewritten}?v=${buildVersion}`;
    }

    return `${rewritten}?v=${buildVersion}`;
  };

  return sourceCode
    .replace(/(\bfrom\s*)(["'])([^"']+)\2/gmu, (match, prefix, quote, specifier) => {
      return `${prefix}${quote}${rewrite(specifier)}${quote}`;
    })
    .replace(/(\bimport\s*\(\s*)(["'])([^"']+)\2(\s*\))/gmu, (match, prefix, quote, specifier, suffix) => {
      return `${prefix}${quote}${rewrite(specifier)}${quote}${suffix}`;
    })
    .replace(/(^\s*import\s*)(["'])([^"']+)\2(\s*;?)/gmu, (match, prefix, quote, specifier, suffix) => {
      return `${prefix}${quote}${rewrite(specifier)}${quote}${suffix}`;
    });
}

async function writeIndexHtml() {
  const importMap = {
    imports: {
      react: "https://esm.sh/react@19.2.4",
      "react-dom": "https://esm.sh/react-dom@19.2.4?external=react",
      "react/jsx-runtime": "https://esm.sh/react@19.2.4/jsx-runtime",
      "react/jsx-dev-runtime": "https://esm.sh/react@19.2.4/jsx-dev-runtime",
      "react-dom/client": "https://esm.sh/react-dom@19.2.4/client?external=react",
      "react-router-dom": "https://esm.sh/react-router-dom@7.13.2?external=react,react-dom",
      axios: "https://esm.sh/axios@1.14.0",
      leaflet: "https://esm.sh/leaflet@1.9.4",
    },
  };

  const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=${buildVersion}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#8d1530" />
    <meta name="description" content="KYZMAT — платформа услуг по Кыргызстану: заказы, специалисты, чат и профильные услуги." />
    <title>KYZMAT</title>
    <script type="importmap">${JSON.stringify(importMap)}</script>
    <link rel="stylesheet" href="/assets/index.css?v=${buildVersion}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.js?v=${buildVersion}"></script>
  </body>
</html>
`;

  await fs.writeFile(path.join(distDir, "index.html"), html, "utf8");
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code || 1}`));
    });

    child.on("error", reject);
  });
}

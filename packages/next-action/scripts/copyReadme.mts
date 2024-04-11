import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("📝 Copying README file...");

const src = path.join(__dirname, "..", "..", "..", "README.md");
const dst = path.join(__dirname, "..", "README.md");
await fs.cp(src, dst);

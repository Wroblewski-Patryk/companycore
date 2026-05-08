import { rm } from "node:fs/promises";
import path from "node:path";

const outputPath = path.resolve("public", "react");
const repositoryRoot = path.resolve(".");

if (!outputPath.startsWith(`${repositoryRoot}${path.sep}`)) {
  throw new Error(`Refusing to clean output outside repository: ${outputPath}`);
}

await rm(outputPath, { recursive: true, force: true });
